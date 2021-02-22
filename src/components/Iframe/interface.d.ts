export interface Props {
  src: string
  onLoad: (event: Event) => void
  getRef: (v: any) => void
  onKeydown: (e: KeyboardEvent) => void
}
