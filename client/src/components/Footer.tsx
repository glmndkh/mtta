import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Facebook, 
  Instagram, 
  Youtube, 
  Mail, 
  Phone, 
  MapPin, 
  ExternalLink,
  Send
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const sponsors = [
  { name: 'Khan Bank', logo: '/objects/uploads/sponsor-khan-bank.png', url: 'https://khanbank.com' },
  { name: 'MCS', logo: '/objects/uploads/sponsor-mcs.png', url: 'https://mcs.mn' },
  { name: 'Tavan Bogd', logo: '/objects/uploads/sponsor-tavan-bogd.png', url: 'https://tavanbogd.mn' },
  { name: 'Монгол Пост', logo: '/objects/uploads/sponsor-mongol-post.png', url: 'https://mongolpost.mn' },
];

export default function Footer() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      // TODO: Implement newsletter signup API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay

      toast({
        title: "Амжилттай бүртгүүллээ!",
        description: "Та мэдээний самбарт амжилттай бүртгүүллээ.",
      });

      setEmail('');

      // TODO: Send to Google Analytics as goal
      if (typeof gtag !== 'undefined') {
        gtag('event', 'newsletter_signup', {
          event_category: 'engagement',
          event_label: 'footer_newsletter'
        });
      }
    } catch (error) {
      toast({
        title: "Алдаа гарлаа",
        description: "Дахин оролдоно уу.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-gray-900 dark:bg-gray-900 [data-theme='light']:bg-gray-100 light:bg-gray-100 text-white dark:text-white [data-theme='light']:text-gray-900 light:text-gray-900 border-t border-gray-800 dark:border-gray-800 [data-theme='light']:border-gray-300 light:border-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Newsletter Section */}
        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold mb-4 text-white dark:text-white [data-theme='light']:text-gray-900 light:text-gray-900">Мэдээний самбар</h3>
          <p className="text-gray-400 dark:text-gray-400 [data-theme='light']:text-gray-600 light:text-gray-600 mb-6 max-w-lg mx-auto">
            Ширээний теннисний сүүлийн үеийн мэдээ, тэмцээний мэдээллийг цаг алдалгүй авах
          </p>
          <form onSubmit={handleNewsletterSubmit} className="flex gap-2 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="И-мэйл хаяг"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-800 dark:bg-gray-800 [data-theme='light']:bg-white light:bg-white border-gray-700 dark:border-gray-700 [data-theme='light']:border-gray-300 light:border-gray-300 text-white dark:text-white [data-theme='light']:text-gray-900 light:text-gray-900 placeholder-gray-400 dark:placeholder-gray-400 [data-theme='light']:placeholder-gray-500 light:placeholder-gray-500"
              required
            />
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-mtta-green hover:bg-green-700 whitespace-nowrap"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-1" />
                  Бүртгүүлэх
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* About Section */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-mtta-green dark:text-mtta-green [data-theme='light']:text-green-600 light:text-green-600">Холбооны тухай</h4>
            <ul className="space-y-2 text-gray-400 dark:text-gray-400 [data-theme='light']:text-gray-600 light:text-gray-600">
              <li>
                <Link href="/about">
                  <span className="hover:text-mtta-green transition-colors cursor-pointer">Танилцуулга</span>
                </Link>
              </li>
              <li>
                <Link href="/about#goals">
                  <span className="hover:text-mtta-green transition-colors cursor-pointer">Зорилго</span>
                </Link>
              </li>
              <li>
                <Link href="/about#history">
                  <span className="hover:text-mtta-green transition-colors cursor-pointer">Түүх</span>
                </Link>
              </li>
              <li>
                <Link href="/about#leadership">
                  <span className="hover:text-mtta-green transition-colors cursor-pointer">Удирдлага</span>
                </Link>
              </li>
              <li>
                <Link href="/branches">
                  <span className="hover:text-mtta-green transition-colors cursor-pointer">Салбарууд</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Sports Section */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-mtta-green dark:text-mtta-green [data-theme='light']:text-green-600 light:text-green-600">Спорт</h4>
            <ul className="space-y-2 text-gray-400 dark:text-gray-400 [data-theme='light']:text-gray-600 light:text-gray-600">
              <li>
                <Link href="/tournaments">
                  <span className="hover:text-mtta-green transition-colors cursor-pointer">Тэмцээнүүд</span>
                </Link>
              </li>
              <li>
                <Link href="/results">
                  <span className="hover:text-mtta-green transition-colors cursor-pointer">Үр дүн / Чансаа</span>
                </Link>
              </li>
              <li>
                <Link href="/clubs">
                  <span className="hover:text-mtta-green transition-colors cursor-pointer">Клубууд</span>
                </Link>
              </li>
              <li>
                <Link href="/past-champions">
                  <span className="hover:text-mtta-green transition-colors cursor-pointer">Аваргууд</span>
                </Link>
              </li>
              <li>
                <Link href="/judges">
                  <span className="hover:text-mtta-green transition-colors cursor-pointer">Шүүгчид</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Section */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-mtta-green dark:text-mtta-green [data-theme='light']:text-green-600 light:text-green-600">Нөөц</h4>
            <ul className="space-y-2 text-gray-400 dark:text-gray-400 [data-theme='light']:text-gray-600 light:text-gray-600">
              <li>
                <Link href="/news">
                  <span className="hover:text-mtta-green transition-colors cursor-pointer">Мэдээ</span>
                </Link>
              </li>
              <li>
                <a 
                  href="/api/rules.pdf" 
                  target="_blank" 
                  className="hover:text-mtta-green transition-colors flex items-center gap-1"
                >
                  Дүрэм журам
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a 
                  href="/api/training-manual.pdf" 
                  target="_blank" 
                  className="hover:text-mtta-green transition-colors flex items-center gap-1"
                >
                  Сургалтын гарын авлага
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <Link href="/register">
                  <span className="hover:text-mtta-green transition-colors cursor-pointer">Тамирчин болох</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-mtta-green dark:text-mtta-green [data-theme='light']:text-green-600 light:text-green-600">Холбоо барих</h4>
            <div className="space-y-3 text-gray-400 dark:text-gray-400 [data-theme='light']:text-gray-600 light:text-gray-600">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">+976-11-123456</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <a 
                  href="mailto:info@mtta.mn" 
                  className="text-sm hover:text-mtta-green transition-colors"
                >
                  info@mtta.mn
                </a>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="text-sm">
                  Үндэсний спортын цогцолбор,<br />
                  Улаанбаатар хот
                </span>
              </div>
            </div>

            {/* Social Media */}
            <div className="flex gap-3 mt-4">
              <a 
                href="https://facebook.com/mtta.mn" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-gray-800 dark:bg-gray-800 [data-theme='light']:bg-gray-200 light:bg-gray-200 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors text-white dark:text-white [data-theme='light']:text-gray-700 light:text-gray-700"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a 
                href="https://instagram.com/mtta.mn" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-gray-800 dark:bg-gray-800 [data-theme='light']:bg-gray-200 light:bg-gray-200 rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors text-white dark:text-white [data-theme='light']:text-gray-700 light:text-gray-700"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a 
                href="https://youtube.com/@mtta.mn" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-gray-800 dark:bg-gray-800 [data-theme='light']:bg-gray-200 light:bg-gray-200 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors text-white dark:text-white [data-theme='light']:text-gray-700 light:text-gray-700"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Sponsors Section */}
        <div className="border-t border-gray-800 dark:border-gray-800 [data-theme='light']:border-gray-300 light:border-gray-300 pt-8 mb-8">
          <h4 className="text-lg font-semibold mb-6 text-center text-mtta-green dark:text-mtta-green [data-theme='light']:text-green-600 light:text-green-600">Ивээн тэтгэгчид</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {sponsors.map((sponsor) => (
              <a
                key={sponsor.name}
                href={sponsor.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center p-4 bg-gray-800 dark:bg-gray-800 [data-theme='light']:bg-white light:bg-white [data-theme='light']:border [data-theme='light']:border-gray-200 light:border light:border-gray-200 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-700 [data-theme='light']:hover:bg-gray-50 light:hover:bg-gray-50 transition-all duration-300 group"
              >
                <img
                  src={sponsor.logo}
                  alt={sponsor.name}
                  className="h-12 object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/objects/uploads/placeholder-sponsor.png';
                  }}
                />
              </a>
            ))}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 dark:border-gray-800 [data-theme='light']:border-gray-300 light:border-gray-300 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-400 dark:text-gray-400 [data-theme='light']:text-gray-600 light:text-gray-600">
              © {new Date().getFullYear()} Монголын Ширээний Теннисний Холбоо. Бүх эрх хуулиар хамгаалагдсан.
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400 dark:text-gray-400 [data-theme='light']:text-gray-600 light:text-gray-600">
              <Link href="/privacy">
                <span className="hover:text-mtta-green transition-colors cursor-pointer">Нууцлалын бодлого</span>
              </Link>
              <Link href="/terms">
                <span className="hover:text-mtta-green transition-colors cursor-pointer">Үйлчилгээний нөхцөл</span>
              </Link>
              <span>
                Хүртээмжтэй веб сайт
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}