
import React from "react";
import Navigation from "@/components/navigation";
import PageWithLoading from "@/components/PageWithLoading";
import { MTTATimelineSection } from "./history/src/components/mtta-timeline-section";

export default function AboutHistory() {
  return (
    <PageWithLoading>
      <Navigation />
      <MTTATimelineSection />
    </PageWithLoading>
  );
}
