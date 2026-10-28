import { SITE } from '@/lib/site';
import { SocialIcon } from './SocialIcons';

export default function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent('Hi Madhuri Sarees! I would like to know more about your sarees.')}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 left-5 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-soft transition hover:scale-105"
    >
      <SocialIcon name="whatsapp" className="h-6 w-6" />
    </a>
  );
}
