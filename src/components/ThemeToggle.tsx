import { useTranslation } from 'react-i18next'
import { Sun, Moon, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { useTheme } from '@/components/ThemeProvider'

const CYCLE: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system']

export function ThemeToggle() {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()

  const next = () => {
    const idx = CYCLE.indexOf(theme)
    setTheme(CYCLE[(idx + 1) % CYCLE.length])
  }

  const Icon = theme === 'dark' ? Moon : theme === 'system' ? Monitor : Sun
  const label = t(`settings.theme${theme.charAt(0).toUpperCase() + theme.slice(1)}`)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={next}
          aria-label={label}
          className="text-[#5a4a72] hover:text-[#8a7a9e] border-transparent"
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {label}
      </TooltipContent>
    </Tooltip>
  )
}
