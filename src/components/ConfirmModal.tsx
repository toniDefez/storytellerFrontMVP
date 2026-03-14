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
import { buttonVariants } from '@/components/ui/button'

interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  danger = false,
}: ConfirmModalProps) {
  const { t } = useTranslation()

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>{cancelText ?? t('modal.defaultCancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={danger ? buttonVariants({ variant: 'destructive' }) : undefined}
          >
            {confirmText ?? t('modal.defaultConfirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
