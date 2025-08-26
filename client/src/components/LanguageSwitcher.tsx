
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === 'mn' ? 'en' : 'mn')}
      className="text-white hover:text-mtta-green flex items-center space-x-1"
    >
      <Globe className="h-4 w-4" />
      <span className="text-sm font-medium">
        {language === 'mn' ? 'EN' : 'МН'}
      </span>
    </Button>
  );
}
