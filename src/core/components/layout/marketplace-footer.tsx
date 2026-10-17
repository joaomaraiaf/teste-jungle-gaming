import { Facebook, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { FOOTER_FEATURES, FOOTER_LINK_COLUMNS } from '@/core/content/marketplace-footer.content';

const socialLinks = [
  { label: 'Facebook', Icon: Facebook },
  { label: 'Instagram', Icon: Instagram },
  { label: 'Twitter', Icon: Twitter },
  { label: 'LinkedIn', Icon: Linkedin },
  { label: 'YouTube', Icon: Youtube },
];

export function MarketplaceFooter() {
  return (
    <footer
      id='footer'
      className='-mx-5 flex w-[calc(100%+2.5rem)] flex-col text-sm sm:-mx-8 sm:w-[calc(100%+4rem)] lg:-mx-[7.5rem] lg:w-[calc(100%+15rem)]'
    >
      <section
        className='grid gap-8 bg-[#241612] px-8 py-8 lg:min-h-[250px] lg:grid-cols-[repeat(3,minmax(0,1fr))_325px] lg:items-end lg:gap-0'
        aria-label='Benefícios Kurio e inscrição na newsletter'
      >
        {FOOTER_FEATURES.map((feature, index) => (
          <article
            key={feature.title}
            className={`flex min-h-[202px] flex-col items-start gap-3 px-0 lg:px-4 ${index > 0 ? 'lg:border-l lg:border-[#D28A4C]' : ''}`}
          >
            <span className='grid size-[74px] place-items-center rounded-full bg-[#D28A4C] text-2xl font-bold text-[#140D0A]'>
              {feature.mark}
            </span>
            <h2 className='text-[17px] font-bold leading-4 text-[#F5F1EB]'>{feature.title}</h2>
            <p className='max-w-[204px] text-sm leading-[22px] text-[#CFB28C]'>
              {feature.description}
            </p>
          </article>
        ))}
        <div className='flex flex-col gap-4 border-t border-[#D28A4C] pt-5 lg:min-h-[202px] lg:justify-center lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0'>
          <div className='flex flex-col gap-4'>
            <h2 className='text-lg font-bold leading-4 text-[#F5F1EB]'>
              Antecipe-se ao próximo lançamento
            </h2>
            <form
              className='flex h-10 w-full rounded-md bg-[#38220F] shadow-[0_0_20px_rgba(10,6,4,.45)]'
              onSubmit={(event) => event.preventDefault()}
            >
              <Input
                type='email'
                aria-label='Seu e-mail'
                placeholder='digite seu e-mail...'
                className='h-full min-w-0 border-0 bg-transparent text-sm text-[#F5F1EB] placeholder:text-[#B39463] focus-visible:ring-0'
              />
              <Button className='h-full rounded-l-none bg-[#D28A4C] px-3 text-md font-bold text-[#140D0A] hover:bg-[#E89B55]'>
                Enviar
              </Button>
            </form>
          </div>
          <p className='text-[13px] leading-[22px] text-[#CFB28C]'>
            Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
          </p>
        </div>
      </section>

      <section className='grid gap-5 bg-[#38220F] px-8 py-6 text-sm sm:grid-cols-2 lg:min-h-[88px] lg:grid-cols-4 lg:items-center lg:gap-8 lg:px-8 lg:py-0'>
        <strong className='font-bold tracking-[0.1em]'>KURIO</strong>
        <p className='max-w-[220px]'>Feito para colecionadores, criadores e cultura</p>
        <a href='mailto:contato@email.com' className='hover:text-[#E89B55]'>
          contato@email.com
        </a>
        <a href='tel:+551140028922' className='hover:text-[#E89B55]'>
          +55 11 4002 8922
        </a>
      </section>

      <section className='flex flex-col gap-6 bg-[#241612] px-8 py-8 lg:min-h-[272px] lg:gap-1'>
        <div className='grid gap-8 sm:grid-cols-2 lg:grid-cols-4'>
          {FOOTER_LINK_COLUMNS.map((column) => (
            <nav key={column.heading} aria-label={column.heading} className='flex flex-col gap-2'>
              <h2 className='text-lg font-bold leading-4'>{column.heading}</h2>
              {column.links.map((label) => (
                <a
                  key={label}
                  href='#catalogo'
                  className='text-sm leading-[30px] hover:text-[#E89B55]'
                >
                  {label}
                </a>
              ))}
            </nav>
          ))}
          <div className='flex flex-col gap-5'>
            <div className='flex flex-col gap-5'>
              <h2 className='text-lg font-bold leading-4'>Redes sociais</h2>
              <div className='flex gap-1'>
                {socialLinks.map(({ label, Icon }) => (
                  <a
                    key={label}
                    href='#footer'
                    aria-label={label}
                    className='grid size-[30px] place-items-center rounded-sm border border-[#D28A4C] text-[#D28A4C] hover:bg-[#D28A4C] hover:text-[#140D0A]'
                  >
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            </div>
            <div className='flex flex-col gap-3'>
              <h2 className='text-lg font-bold leading-4'>Carteiras compatíveis</h2>
              <p className='w-fit rounded-md border border-[#55321F] bg-[#38220F] px-2 py-1 text-[9px] font-bold tracking-[0.02em] text-[#E89B55]'>
                METAMASK · WALLETCONNECT · COINBASE
              </p>
            </div>
          </div>
        </div>
      </section>
      <p className='pt-2 text-center leading-[30px]'>
        © 2026 Kurio. Propriedade digital para todos.
      </p>
    </footer>
  );
}
