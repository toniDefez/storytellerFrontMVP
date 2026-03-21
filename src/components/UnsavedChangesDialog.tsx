import type { Blocker } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Props {
  blocker: Blocker
}

export function UnsavedChangesDialog({ blocker }: Props) {
  const { t } = useTranslation()
  return (
    <AlertDialog open={blocker.state === 'blocked'}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('guard.unsavedTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('guard.unsavedDesc')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => blocker.reset?.()}>
            {t('guard.unsavedStay')}
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => blocker.proceed?.()}>
            {t('guard.unsavedLeave')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
