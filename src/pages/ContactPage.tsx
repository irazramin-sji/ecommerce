import React from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ContactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  subject: z.string().optional(),
  message: z.string().min(5)
});

export default function ContactPage() {
  const { register, handleSubmit, formState, reset } = useForm({
    resolver: zodResolver(ContactSchema)
  });

  async function onSubmit(values: any) {
    try {
      const res = await supabase.functions.invoke("contact", { method: "POST", body: JSON.stringify(values) });
      if (!res.ok) {
        const text = await res.text();
        toast.error("Failed to send: " + text);
        return;
      }
      toast.success("Message sent");
      reset();
    } catch (e: any) {
      toast.error(e.message || "Failed to send message");
    }
  }

  return (
    <PageLayout>
      <PageLayout.Header>
        <div className="py-6"><h1 className="text-2xl font-bold">Contact Us</h1></div>
      </PageLayout.Header>

      <PageLayout.Content>
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input {...register("name")} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input {...register("email")} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium">Subject</label>
            <input {...register("subject")} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium">Message</label>
            <textarea {...register("message")} className="input h-32" />
          </div>
          <div>
            <Button type="submit">Send Message</Button>
          </div>
        </form>
      </PageLayout.Content>
    </PageLayout>
  );
}
