
import React from 'react';
import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { MTTATimelineSection } from "./history/src/components/mtta-timeline-section";
import Footer from "@/components/Footer";

const HistoryTimelinePage = () => {
  return (
    <PageWithLoading>
      <Navigation />
      <MTTATimelineSection />
      <Footer />
    </PageWithLoading>
  );
};

export default HistoryTimelinePage;
