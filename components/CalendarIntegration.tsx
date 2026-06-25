'use client';

import { motion } from 'framer-motion';
import { Calendar, ExternalLink, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface CalendarIntegrationProps {
  eventTitle: string;
  eventDescription: string;
  suggestedDate: string;
}

export function CalendarIntegration({ eventTitle, eventDescription, suggestedDate }: CalendarIntegrationProps) {
  const [added, setAdded] = useState(false);

  const addToGoogleCalendar = () => {
    const startDate = new Date(suggestedDate);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour later
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&details=${encodeURIComponent(eventDescription)}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
    
    window.open(googleCalendarUrl, '_blank');
    setAdded(true);
    toast.success('📅 Calendar event created!', { duration: 3000 });
  };

  const addToOutlook = () => {
    const startDate = new Date(suggestedDate);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    
    const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(eventTitle)}&body=${encodeURIComponent(eventDescription)}&startdt=${startDate.toISOString()}&enddt=${endDate.toISOString()}`;
    
    window.open(outlookUrl, '_blank');
    setAdded(true);
    toast.success('📅 Calendar event created!', { duration: 3000 });
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
      border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '16px', padding: '20px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Calendar style={{ width: '20px', height: '20px', color: 'white' }} />
        </div>
        <div>
          <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'white', marginBottom: '2px' }}>
            Schedule Filing Reminder
          </h4>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
            {suggestedDate}
          </p>
        </div>
      </div>

      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '16px', lineHeight: 1.5 }}>
        {eventDescription}
      </p>

      {added ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '12px',
          background: 'rgba(16, 185, 129, 0.2)', borderRadius: '10px',
          border: '1px solid rgba(16, 185, 129, 0.3)'
        }}>
          <CheckCircle style={{ width: '16px', height: '16px', color: '#10b981' }} />
          <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 600 }}>
            Reminder added to calendar
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px' }}>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={addToGoogleCalendar}
            style={{
              flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
              color: 'white', fontSize: '13px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}>
            <ExternalLink style={{ width: '14px', height: '14px' }} />
            Google Calendar
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={addToOutlook}
            style={{
              flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
              color: 'white', fontSize: '13px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}>
            <ExternalLink style={{ width: '14px', height: '14px' }} />
            Outlook
          </motion.button>
        </div>
      )}
    </div>
  );
}
