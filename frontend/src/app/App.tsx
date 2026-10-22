import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode, useState } from 'react'
import { RouterProvider } from 'react-router'
import { t } from '@/i18n'
import { ConfirmProvider, ToastProvider } from '@/ui'
import { createAppRouter } from './router'
import type { Services } from './services'
import { ServicesProvider } from './ServicesProvider'
import { SessionProvider } from './session/SessionProvider'
import { TenantProvider } from './TenantProvider'

export function App({ services }: { readonly services: Services }) {
  const [router] = useState(() => createAppRouter(services))
  return (
    <StrictMode>
      <QueryClientProvider client={services.queryClient}>
        <ServicesProvider services={services}>
          <SessionProvider>
            <TenantProvider>
              <ToastProvider dismissLabel={t('common.dismiss')}>
                <ConfirmProvider>
                  <RouterProvider router={router} />
                </ConfirmProvider>
              </ToastProvider>
            </TenantProvider>
          </SessionProvider>
        </ServicesProvider>
      </QueryClientProvider>
    </StrictMode>
  )
}
