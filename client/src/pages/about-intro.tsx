
import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { Card, CardContent } from "@/components/ui/card";
import { Mountain, Eye, HandHeart, Users } from "lucide-react";

export default function AboutIntro() {
  return (
    <PageWithLoading>
      <Navigation />
      <div className="main-bg min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Танилцуулга
          </h1>

          {/* Federation Introduction */}
          <section className="mb-16">
            <Card className="card-dark p-8">
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  Монголын ширээний теннисний холбоо нь 1965 онд байгуулагдсан бөгөөд тэр цагаас хойш 
                  Монгол орны ширээний теннисний спортыг хөгжүүлэх чиглэлээр үйл ажиллагаа явуулж ирсэн. 
                  Холбоо нь Олон улсын ширээний теннисний холбоо (ITTF)-ын гишүүн байдаг.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Mission, Vision, Values */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
              Эрхэм зорилго
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="card-dark text-center p-6">
                <CardContent className="pt-6">
                  <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Mountain className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4">ЭРХЭМ ЗОРИЛГО</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Монголын ширээний теннисний холбоо нь спортын хөгжил, тамирчдын сургалт, дэмжлэгт чиглэсэн үйл ажиллагаа явуулж, олон улсын хамтын ажиллагааг хөгжүүлнэ.
                  </p>
                </CardContent>
              </Card>

              <Card className="card-dark text-center p-6">
                <CardContent className="pt-6">
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Eye className="w-10 h-10 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-4">АЛСЫН ХАРАА</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Монгол тамирчдыг олон улсын түвшинд тэмцэж, дэлхийн аварга болж, ширээний теннисийг Монголд түгээмэл спорт болгох зорилготой.
                  </p>
                </CardContent>
              </Card>

              <Card className="card-dark text-center p-6">
                <CardContent className="pt-6">
                  <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-6">
                    <HandHeart className="w-10 h-10 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="text-xl font-bold text-orange-600 dark:text-orange-400 mb-4">ҮНЭТ ЗҮЙЛС</h3>
                  <div className="text-left">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                      <span className="text-gray-700 dark:text-gray-300">Спортын ёс зүй</span>
                    </div>
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                      <span className="text-gray-700 dark:text-gray-300">Хамтын ажиллагаа</span>
                    </div>
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                      <span className="text-gray-700 dark:text-gray-300">Залуусын дэмжлэг</span>
                    </div>
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                      <span className="text-gray-700 dark:text-gray-300">Олон улсын стандарт</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                      <span className="text-gray-700 dark:text-gray-300">Тэргүүлэх арга барил</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Leadership */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
              Удирдлагын баг
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="card-dark text-center">
                <CardContent className="p-6">
                  <div className="w-24 h-24 bg-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="w-12 h-12 text-gray-300" />
                  </div>
                  <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">Ц. Гантулга</h3>
                  <p className="text-green-400 text-sm mb-2">Ерөнхийлөгч</p>
                  <p className="text-gray-700 dark:text-gray-300 text-xs">
                    Монголын ширээний теннисний хөгжилд 25 жил ажилласан туршлагатай
                  </p>
                </CardContent>
              </Card>

              <Card className="card-dark text-center">
                <CardContent className="p-6">
                  <div className="w-24 h-24 bg-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="w-12 h-12 text-gray-300" />
                  </div>
                  <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">Б. Мөнхбат</h3>
                  <p className="text-green-400 text-sm mb-2">Гүйцэтгэх захирал</p>
                  <p className="text-gray-700 dark:text-gray-300 text-xs">
                    Олон улсын тэмцээн, төсөл хэрэгжүүлэх чиглэлийг удирддаг
                  </p>
                </CardContent>
              </Card>

              <Card className="card-dark text-center">
                <CardContent className="p-6">
                  <div className="w-24 h-24 bg-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="w-12 h-12 text-gray-300" />
                  </div>
                  <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">Д. Энхтүүшин</h3>
                  <p className="text-green-400 text-sm mb-2">Сургалтын албаны дарга</p>
                  <p className="text-gray-700 dark:text-gray-300 text-xs">
                    Багш, дасгалжуулагчдын сургалт, арга зүйн ажилыг удирддаг
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </div>
    </PageWithLoading>
  );
}
