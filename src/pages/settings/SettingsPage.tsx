import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { PillSelect } from '@/components/PillSelect'
import { InstallationSection } from './InstallationSection'
import { Globe } from 'lucide-react'

export default function SettingsPage() {
  const { t, i18n } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'general'

  useEffect(() => {
    document.title = `${t('pageTitle.settings')} — StoryTeller`
  }, [t, i18n.language])

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true })
  }

  const handleLanguageChange = (lang: string) => {
    if (!lang) return
    i18n.changeLanguage(lang)
  }

  return (
    <div className="max-w-2xl mx-auto mt-8 space-y-6">
      <PageBreadcrumb items={[{ label: t('settings.title') }]} />

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="general">{t('settings.tabGeneral')}</TabsTrigger>
          <TabsTrigger value="installation">{t('settings.tabInstallation')}</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {t('settings.language')}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.languageHint')}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <PillSelect
                options={[
                  { value: 'es', label: t('settings.languageEs') },
                  { value: 'en', label: t('settings.languageEn') },
                ]}
                value={i18n.language.startsWith('es') ? 'es' : 'en'}
                onChange={handleLanguageChange}
                allowDeselect={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="installation" className="mt-6">
          <InstallationSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}
