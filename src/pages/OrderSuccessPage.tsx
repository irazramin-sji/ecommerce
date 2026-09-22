import React from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function OrderSuccessPage() {
  return (
    <PageLayout>
      <PageLayout.Header>
        <div className="py-6"><h1 className="text-2xl font-bold">Thank you for your order</h1></div>
      </PageLayout.Header>

      <PageLayout.Content>
        <div className="max-w-2xl mx-auto text-center py-12">
          <p className="mb-4">Your order has been received. A confirmation email will be sent shortly.</p>
          <Link to="/"><Button>Back to Home</Button></Link>
        </div>
      </PageLayout.Content>
    </PageLayout>
  );
}
