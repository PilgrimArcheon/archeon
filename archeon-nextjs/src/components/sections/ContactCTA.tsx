import { ArrowUpRight, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ActionLink } from "@/components/ui/ActionLink";

export function ContactCTA() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <div className="relative isolate overflow-hidden rounded-[2.5rem] border border-accent/20 bg-[#201a39] px-7 py-16 text-center text-white sm:px-14 sm:py-20">
          <div className="pointer-events-none absolute -right-20 -top-40 h-96 w-96 rounded-full bg-[#9074fa]/25 blur-[75px]" aria-hidden />
          <div className="pointer-events-none absolute -bottom-44 -left-20 h-96 w-96 rounded-full bg-[#9474e0]/20 blur-[75px]" aria-hidden />
          <div className="relative mx-auto max-w-3xl">
            <Sparkles className="mx-auto mb-5 text-[#c6b5ff]" size={28} aria-hidden />
            <p className="text-xs font-bold uppercase tracking-[.25em] text-[#c6b5ff]">Have something in mind?</p>
            <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">Let&apos;s make something <span className="text-[#b9a3ff]">worth playing.</span></h2>
            <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-[#ccc7db]">A game idea, a tricky system, or a creative collaboration — I&apos;d love to hear about it.</p>
            <div className="mt-9"><ActionLink href="/contact" className="bg-white text-[#171020] hover:bg-[#d6caff] hover:text-[#171020]" icon={false}>Start a conversation <ArrowUpRight size={18} aria-hidden /></ActionLink></div>
          </div>
        </div>
      </Container>
    </section>
  );
}
