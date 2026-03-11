import React from 'react';
import { Court } from '../types';

const MapComponent: React.FC<{ court: Court }> = ({ court }) => {
  const defaultMapUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d494.9412219687384!2d125.59673685266986!3d7.0644019234539295!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x32f96d6362c41db1%3A0xcb1e8b779d4d959a!2sUniversity%20of%20Mindanao%20Dr%2C%20Talomo%2C%20Davao%20City%2C%20Davao%20del%20Sur!5e0!3m2!1sen!2sph!4v1772108188373!5m2!1sen!2sph";
  
  return (
    <div className="w-full h-[300px] md:h-[450px] overflow-hidden bg-slate-50">
      <iframe 
        src={court.mapUrl || defaultMapUrl} 
        width="100%" 
        height="100%" 
        style={{ border: 0 }} 
        allowFullScreen={true} 
        loading="lazy" 
        referrerPolicy="no-referrer-when-downgrade"
        title={`Map location for ${court.name}`}
      ></iframe>
    </div>
  );
};

export default MapComponent;
