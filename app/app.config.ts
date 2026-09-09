export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',
      neutral: 'slate'
    },
    formField: {
      slots: {
        label: 'mb-1 block text-sm font-medium text-[var(--text-primary)]',
        description: 'text-xs text-[var(--text-muted)]',
        error: 'mt-1 text-xs text-[var(--color-danger)]',
        hint: 'text-xs text-[var(--text-muted)]'
      }
    },
    input: {
      defaultVariants: {
        color: 'neutral',
        variant: 'outline',
        size: 'md'
      }
    },
    select: {
      defaultVariants: {
        color: 'neutral',
        variant: 'outline',
        size: 'md'
      }
    },
    textarea: {
      defaultVariants: {
        color: 'neutral',
        variant: 'outline',
        size: 'md'
      }
    }
  }
})
