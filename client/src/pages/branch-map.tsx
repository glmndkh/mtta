
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MongoliaMap from '@/components/MongoliaMap';
import PageLayout from '@/components/PageLayout';

const BranchMapPage: React.FC = () => {
  // Sample branch locations across Mongolia
  const branchLocations = [
    {
      id: '1',
      name: 'Улаанбаатар төв салбар',
      lat: 47.9184,
      lng: 106.9177,
      address: 'Сүхбаатар дүүрэг, 1-р хороо',
      phone: '+976-11-123456',
      description: 'Үндсэн төв салбар'
    },
    {
      id: '2',
      name: 'Дархан салбар',
      lat: 49.4861,
      lng: 105.9222,
      address: 'Дархан-Уул аймаг, Дархан хот',
      phone: '+976-70-123456',
      description: 'Хойд бүсийн салбар'
    },
    {
      id: '3',
      name: 'Эрдэнэт салбар',
      lat: 49.0347,
      lng: 104.0828,
      address: 'Орхон аймаг, Эрдэнэт хот',
      phone: '+976-35-123456',
      description: 'Уул уурхайн бүсийн салбар'
    },
    {
      id: '4',
      name: 'Чойбалсан салбар',
      lat: 48.0569,
      lng: 114.5086,
      address: 'Дорнод аймаг, Чойбалсан хот',
      phone: '+976-58-123456',
      description: 'Зүүн бүсийн салбар'
    },
    {
      id: '5',
      name: 'Ховд салбар',
      lat: 48.0056,
      lng: 91.6419,
      address: 'Ховд аймаг, Ховд хот',
      phone: '+976-43-123456',
      description: 'Баруун бүсийн салбар'
    },
    {
      id: '6',
      name: 'Мөрөн салбар',
      lat: 49.6342,
      lng: 100.1625,
      address: 'Хөвсгөл аймаг, Мөрөн хот',
      phone: '+976-38-123456',
      description: 'Хөвсгөл аймгийн салбар'
    },
    {
      id: '7',
      name: 'Сайншанд салбар',
      lat: 44.8833,
      lng: 110.1167,
      address: 'Дорноговь аймаг, Сайншанд хот',
      phone: '+976-52-123456',
      description: 'Өмнөговийн салбар'
    },
    {
      id: '8',
      name: 'Баянхонгор салбар',
      lat: 46.1944,
      lng: 100.7181,
      address: 'Баянхонгор аймаг, Баянхонгор хот',
      phone: '+976-48-123456',
      description: 'Төв-өмнөд бүсийн салбар'
    },
    {
      id: '9',
      name: 'Алтай салбар',
      lat: 46.3722,
      lng: 96.2583,
      address: 'Говь-Алтай аймаг, Алтай хот',
      phone: '+976-45-123456',
      description: 'Говь-Алтайн салбар'
    },
    {
      id: '10',
      name: 'Өндөрхаан салбар',
      lat: 47.3167,
      lng: 110.6500,
      address: 'Хэнтий аймаг, Өндөрхаан хот',
      phone: '+976-54-123456',
      description: 'Хэнтийн салбар'
    }
  ];

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-4">
            Монгол Теннисний Холбооны Салбар Нэгжүүд
          </h1>
          <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto">
            Монгол орон даяар байрлах манай салбар нэгжүүдийн байршлыг газрын зураг дээрээс харна уу.
            Таны ойр орчмын салбарыг олж, холбоо барина уу.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🗺️ Салбар нэгжүүдийн байршил
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MongoliaMap 
                  branches={branchLocations}
                  height="600px"
                  apiKey={process.env.GOOGLE_MAPS_API_KEY}
                />
              </CardContent>
            </Card>
          </div>

          {/* Branch List Section */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📍 Салбар нэгжүүдийн жагсаалт
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {branchLocations.map((branch) => (
                    <div 
                      key={branch.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <h3 className="font-semibold text-primary mb-2">
                        {branch.name}
                      </h3>
                      {branch.address && (
                        <p className="text-sm text-muted-foreground mb-1">
                          📍 {branch.address}
                        </p>
                      )}
                      {branch.phone && (
                        <p className="text-sm text-muted-foreground mb-1">
                          📞 {branch.phone}
                        </p>
                      )}
                      {branch.description && (
                        <p className="text-sm text-muted-foreground">
                          {branch.description}
                        </p>
                      )}
                      <div className="text-xs text-muted-foreground mt-2">
                        Координат: {branch.lat.toFixed(4)}, {branch.lng.toFixed(4)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Statistics Section */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>📊 Салбар нэгжүүдийн статистик</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {branchLocations.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Нийт салбар
                  </div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    21
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Аймаг хот
                  </div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    4
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Бүс нутаг
                  </div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    1,564,110
                  </div>
                  <div className="text-sm text-muted-foreground">
                    км² (Монголын нутаг дэвсгэр)
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default BranchMapPage;
