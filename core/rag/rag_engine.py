"""
Compliance RAG Engine — Equinox Nexus v3.0
Uses ChromaDB (local vector store) + sentence-transformers (local embeddings).
NO API KEY REQUIRED. Fully offline inference.

Documents are chunked compliance KB markdown files covering:
UK, Germany, Singapore, UAE, USA, Japan, Australia, India, Netherlands, Canada
"""

import os
import glob
import hashlib
import pickle
from typing import List, Dict, Any, Optional
from pathlib import Path

KB_DIR = Path(__file__).parent / "compliance_kb"
CHROMA_DIR = Path(__file__).parent / "chroma_db"
INDEX_HASH_FILE = Path(__file__).parent / "kb_index.hash"

# Lazy imports — only load heavy libraries when needed
_chroma_client = None
_collection = None
_encoder = None


def _get_encoder():
    global _encoder
    if _encoder is None:
        from sentence_transformers import SentenceTransformer
        _encoder = SentenceTransformer("all-MiniLM-L6-v2")
    return _encoder


def _get_collection():
    global _chroma_client, _collection
    if _collection is None:
        import chromadb
        _chroma_client = chromadb.PersistentClient(path=str(CHROMA_DIR))
        _collection = _chroma_client.get_or_create_collection(
            name="compliance_kb",
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def _compute_kb_hash() -> str:
    """Hash all KB files to detect changes requiring re-index."""
    files = sorted(glob.glob(str(KB_DIR / "*.md")))
    h = hashlib.md5()
    for f in files:
        h.update(Path(f).read_bytes())
    return h.hexdigest()


def _chunk_document(text: str, chunk_size: int = 400, overlap: int = 80) -> List[str]:
    """
    Split a document into overlapping chunks by words.
    Overlap ensures context is not lost at chunk boundaries.
    """
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i : i + chunk_size])
        chunks.append(chunk)
        i += chunk_size - overlap
    return chunks


def build_index(force: bool = False) -> int:
    """
    Build or rebuild the ChromaDB index from all KB markdown files.
    Returns number of chunks indexed.
    Only rebuilds if KB files have changed (detected via hash).
    """
    current_hash = _compute_kb_hash()

    if not force and INDEX_HASH_FILE.exists():
        stored_hash = INDEX_HASH_FILE.read_text().strip()
        if stored_hash == current_hash:
            print("RAG: Index is up to date. Skipping rebuild.")
            return _get_collection().count()

    print("RAG: Building compliance knowledge index...")
    encoder = _get_encoder()
    collection = _get_collection()

    # Clear existing data
    try:
        existing_ids = collection.get()["ids"]
        if existing_ids:
            collection.delete(ids=existing_ids)
    except Exception:
        pass

    md_files = sorted(glob.glob(str(KB_DIR / "*.md")))
    if not md_files:
        print("RAG: WARNING — No markdown files found in compliance_kb/")
        return 0

    all_chunks = []
    all_ids = []
    all_metadata = []

    for filepath in md_files:
        country_name = Path(filepath).stem.replace("_compliance", "").replace("_", " ").title()
        text = Path(filepath).read_text(encoding="utf-8")
        chunks = _chunk_document(text)

        for j, chunk in enumerate(chunks):
            chunk_id = f"{Path(filepath).stem}_{j}"
            all_chunks.append(chunk)
            all_ids.append(chunk_id)
            all_metadata.append({
                "source": Path(filepath).name,
                "country": country_name,
                "chunk_index": j,
            })

    # Encode in batches
    print(f"RAG: Encoding {len(all_chunks)} chunks from {len(md_files)} documents...")
    embeddings = encoder.encode(all_chunks, batch_size=32, show_progress_bar=False).tolist()

    # Upsert into ChromaDB
    collection.upsert(
        ids=all_ids,
        embeddings=embeddings,
        documents=all_chunks,
        metadatas=all_metadata,
    )

    # Save hash so we don't re-index unnecessarily
    INDEX_HASH_FILE.write_text(current_hash)
    count = collection.count()
    print(f"RAG: Index built. {count} chunks indexed across {len(md_files)} documents.")
    return count


class ComplianceRAGEngine:
    """
    Retrieval-Augmented Generation engine for tax and compliance intelligence.
    Retrieves semantically relevant passages from the compliance knowledge base.
    No LLM API calls — uses local embedding model for retrieval only.
    """

    def __init__(self, auto_build: bool = True):
        if auto_build:
            try:
                build_index(force=False)
            except Exception as e:
                print(f"RAG: Index build failed: {e}. Will use fallback.")

    def query(
        self,
        question: str,
        country_filter: Optional[str] = None,
        k: int = 4,
    ) -> List[Dict[str, Any]]:
        """
        Query the compliance knowledge base.
        Returns list of dicts: {text, source, country, relevance_score}
        """
        try:
            encoder = _get_encoder()
            collection = _get_collection()

            if collection.count() == 0:
                return []

            query_embedding = encoder.encode([question]).tolist()

            where_filter = None
            if country_filter:
                where_filter = {"country": {"$eq": country_filter}}

            results = collection.query(
                query_embeddings=query_embedding,
                n_results=min(k, collection.count()),
                where=where_filter,
                include=["documents", "metadatas", "distances"],
            )

            passages = []
            docs = results.get("documents", [[]])[0]
            metas = results.get("metadatas", [[]])[0]
            dists = results.get("distances", [[]])[0]

            for doc, meta, dist in zip(docs, metas, dists):
                # Convert cosine distance to similarity score
                similarity = round(1.0 - dist, 4)
                if similarity > 0.15:  # Filter very low relevance
                    passages.append({
                        "text": doc,
                        "source": meta.get("source", "unknown"),
                        "country": meta.get("country", "unknown"),
                        "relevance_score": similarity,
                    })

            return passages

        except Exception as e:
            print(f"RAG: Query failed: {e}")
            return []

    def get_compliance_brief(
        self,
        city: str,
        country: str,
        income: float,
        currency: str = "USD",
        query_topics: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        High-level method called by NexusAgent.
        Returns structured compliance brief for a city/country.
        """
        if query_topics is None:
            query_topics = [
                f"income tax rates {country}",
                f"visa work permit {country} professional",
                f"social security contributions {country}",
                f"double taxation agreement DTA {country} India",
            ]

        all_passages = []
        for topic in query_topics:
            passages = self.query(question=topic, k=3)
            all_passages.extend(passages)

        # Deduplicate by source chunk
        seen = set()
        unique_passages = []
        for p in all_passages:
            key = p["text"][:100]
            if key not in seen:
                seen.add(key)
                unique_passages.append(p)

        # Sort by relevance
        unique_passages.sort(key=lambda x: x["relevance_score"], reverse=True)
        top_passages = unique_passages[:6]

        # Build structured brief from retrieved content
        brief_text = "\n\n---\n\n".join([
            f"[Source: {p['country']} Compliance DB | Relevance: {p['relevance_score']:.2f}]\n{p['text']}"
            for p in top_passages
        ])

        return {
            "retrieved_passages": top_passages,
            "compliance_brief": brief_text,
            "sources_used": list({p["source"] for p in top_passages}),
            "rag_retrieval_count": len(top_passages),
            "retrieval_method": "ChromaDB + all-MiniLM-L6-v2 (local)",
        }


# Singleton instance — initialized once at import time
_rag_engine: Optional[ComplianceRAGEngine] = None


def get_rag_engine() -> ComplianceRAGEngine:
    global _rag_engine
    if _rag_engine is None:
        _rag_engine = ComplianceRAGEngine(auto_build=True)
    return _rag_engine
