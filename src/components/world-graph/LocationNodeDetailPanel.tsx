import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Ban, ChevronDown, ChevronRight, Crown, Hourglass, Plus, Sparkles, Trash2, Users, WandSparkles, Wind, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InlineText } from '@/components/places/InlineText'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { LocationNode, LocationNodePatch, NarrativeFunction } from '@/services/api'
import { NARRATIVE_FN_LABELS, nodeTypeLabel } from './locationLabels'
import { NODE_TYPES, NODE_TYPE_ICONS } from './placeIcons'
import { notifyPlaceError } from './placeErrors'

const NARRATIVE_FNS: NarrativeFunction[] = ['conflict', 'origin', 'threshold', 'atmosphere']

const PILL = 'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors'
const PILL_ON = 'border-entity-location/40 bg-entity-location/10 text-entity-location'
const PILL_OFF = 'border-border text-muted-foreground hover:border-entity-location/40 hover:text-foreground'

interface Props {
  node: LocationNode
  connectedNodes: LocationNode[]
  childNodes: LocationNode[]
  /** Guarda solo lo que cambia. */
  onUpdate: (id: number, patch: LocationNodePatch) => Promise<void>
  onDelete: (id: number) => Promise<void>
  /** Entra en modo «colocar» para un lugar dentro de este. */
  onAddInside: (node: LocationNode) => void
  onExpandWithAI: (node: LocationNode) => void
  expandingNodeId: number | null
  onEnrichWithAI: (node: LocationNode) => void
  enrichingNodeId: number | null
  onSelectNode: (node: LocationNode) => void
  onClose: () => void
}

export function LocationNodeDetailPanel({
  node, connectedNodes, childNodes, onUpdate, onDelete, onAddInside,
  onExpandWithAI, expandingNodeId, onEnrichWithAI, enrichingNodeId, onSelectNode, onClose,
}: Props) {
  const { t } = useTranslation()
  const [storyLayerOpen, setStoryLayerOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isExpanding = expandingNodeId === node.id
  const isEnriching = enrichingNodeId === node.id
  const p = node.properties ?? {}

  const save = (patch: LocationNodePatch) => {
    onUpdate(node.id, patch).catch(err => notifyPlaceError(t, err, 'location.map.saveError'))
  }
  const handleDelete = async () => {
    try {
      await onDelete(node.id)
    } catch (err) {
      notifyPlaceError(t, err, 'location.map.deleteError')
    }
  }

  const storyLayer = [
    { icon: Wind, text: p.atmosphere, italic: true },
    { icon: Users, text: p.social_filter },
    { icon: Ban, text: p.behavioral_rule },
    { icon: Crown, text: p.control },
    { icon: Hourglass, text: p.duration },
  ].filter(row => row.text)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="size-2.5 rounded-full bg-entity-location" aria-hidden />
          {t('location.map.panelLabel')}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('location.map.close')}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <InlineText
          value={node.name}
          required
          label={t('location.map.name')}
          onCommit={name => save({ name })}
          className="h-auto py-1 font-display text-xl font-semibold md:text-xl"
        />

        <section className="space-y-2">
          <h4 className="font-body text-sm text-muted-foreground">{t('location.map.type')}</h4>
          <div className="flex flex-wrap gap-1.5">
            {NODE_TYPES.map(type => {
              const Icon = NODE_TYPE_ICONS[type]
              const on = node.node_type === type
              return (
                <button
                  key={type}
                  type="button"
                  aria-pressed={on}
                  onClick={() => { if (!on) save({ node_type: type }) }}
                  className={`${PILL} ${on ? PILL_ON : PILL_OFF}`}
                >
                  <Icon className="size-3.5" />
                  {nodeTypeLabel(type)}
                </button>
              )
            })}
          </div>
        </section>

        <section className="space-y-2">
          <h4 className="font-body text-sm text-muted-foreground">{t('location.map.narrativeFunction')}</h4>
          <div className="flex flex-wrap gap-1.5">
            {NARRATIVE_FNS.map(fn => {
              const on = node.narrative_function === fn
              return (
                <button
                  key={fn}
                  type="button"
                  aria-pressed={on}
                  onClick={() => save({ narrative_function: on ? '' : fn })}
                  className={`${PILL} ${on ? PILL_ON : PILL_OFF}`}
                >
                  {NARRATIVE_FN_LABELS[fn]}
                </button>
              )
            })}
          </div>
        </section>

        <section className="space-y-1">
          <h4 className="font-body text-sm text-muted-foreground">{t('location.map.description')}</h4>
          <InlineText
            multiline
            value={node.description ?? ''}
            label={t('location.map.description')}
            placeholder={t('location.map.descriptionPlaceholder')}
            onCommit={description => save({ description })}
            className="text-sm leading-relaxed"
          />
        </section>

        {node.source_hint && (
          <p className="border-l-2 border-entity-location/30 pl-2 text-sm italic text-muted-foreground">
            {node.source_hint}
          </p>
        )}

        {/* Por qué está donde está en el mapa: lo deriva el terreno, no el modelo. */}
        {typeof p.emplazamiento === 'string' && p.emplazamiento && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground/80">{t('location.map.onMap')}:</span> {p.emplazamiento}
          </p>
        )}

        {storyLayer.length > 0 && (
          <section className="overflow-hidden rounded-lg border border-border/60">
            <button
              type="button"
              onClick={() => setStoryLayerOpen(o => !o)}
              aria-expanded={storyLayerOpen}
              className="flex w-full items-center justify-between px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/40"
            >
              {t('location.map.storyLayer')}
              {storyLayerOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            </button>
            {storyLayerOpen && (
              <ul className="space-y-2 px-3 pb-3 pt-1">
                {storyLayer.map(({ icon: Icon, text, italic }, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    <span className={italic ? 'italic' : undefined}>{text}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {connectedNodes.length > 0 && (
          <section className="space-y-2">
            <h4 className="font-body text-sm text-muted-foreground">{t('location.map.connections')}</h4>
            <div className="flex flex-wrap gap-1.5">
              {connectedNodes.map(n => (
                <button key={n.id} type="button" onClick={() => onSelectNode(n)} className={`${PILL} ${PILL_OFF}`}>
                  {n.name}
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-1.5">
          <h4 className="font-body text-sm text-muted-foreground">
            {t('location.map.inside')}
            {childNodes.length > 0 && <span className="ml-1 text-muted-foreground/60">({childNodes.length})</span>}
          </h4>
          {childNodes.length > 0 ? (
            <ul className="space-y-0.5">
              {childNodes.map(child => {
                const Icon = NODE_TYPE_ICONS[child.node_type] ?? NODE_TYPE_ICONS.settlement
                return (
                  <li key={child.id}>
                    <button
                      type="button"
                      onClick={() => onSelectNode(child)}
                      className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-entity-location/10"
                    >
                      <Icon className="size-4 shrink-0 text-muted-foreground group-hover:text-entity-location" />
                      <span className="truncate font-display text-[15px] text-foreground group-hover:text-entity-location">{child.name}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="px-2 text-sm italic text-muted-foreground">{t('location.map.noneInside')}</p>
          )}
          <Button variant="link" size="sm" className="h-auto gap-1.5 px-2 text-entity-location" onClick={() => onAddInside(node)}>
            <Plus className="size-3.5" /> {t('location.map.addInside')}
          </Button>
        </section>
      </div>

      <div className="space-y-2 border-t border-border/50 p-4">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={() => onEnrichWithAI(node)} disabled={isEnriching} className="gap-1.5">
            <WandSparkles className="size-3.5" />
            {isEnriching ? t('location.map.enriching') : t('location.map.enrichAI')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => onExpandWithAI(node)} disabled={isExpanding} className="gap-1.5" title={t('location.map.expandAI')}>
            <Sparkles className="size-3.5" />
            <span className="truncate">{isExpanding ? t('location.map.expanding') : t('location.map.expandAI')}</span>
          </Button>
        </div>
        <Button
          variant="link"
          size="sm"
          onClick={() => setConfirmDelete(true)}
          className="w-full gap-1.5 text-destructive hover:text-destructive"
        >
          <Trash2 className="size-3.5" /> {t('location.map.delete')}
        </Button>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">{t('location.map.deleteTitle', { name: node.name })}</AlertDialogTitle>
            <AlertDialogDescription>{t('location.map.deleteBody')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('location.map.cancel')}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              {t('location.map.deleteConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
