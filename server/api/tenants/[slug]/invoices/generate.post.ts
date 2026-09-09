import { and, eq } from 'drizzle-orm'
import { withOrgContext } from '~~/server/db/client'
import { assessmentTypes, invoices, units } from '~~/server/db/schema'
import { requirePermission } from '~~/server/utils/auth'
import { getOrgBySlug } from '~~/server/utils/org'
import { sanitizeText } from '~~/app/core/utils/sanitize'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const session = await requirePermission(event, slug, 'invoice.generate')
  const org = await getOrgBySlug(slug)
  const body = await readBody<{
    assessmentTypeId: string
    period: string
    dueDate: string
  }>(event)

  const assessmentTypeId = body.assessmentTypeId?.trim()
  const period = sanitizeText(body.period || '', 16)
  const dueDate = body.dueDate?.trim()
  if (!assessmentTypeId || !period || !dueDate) {
    throw createError({ statusCode: 400, statusMessage: 'assessmentTypeId, period, and dueDate required' })
  }

  return withOrgContext(
    { organizationId: org.id, role: session.role, userId: session.userId },
    async (tx) => {
      const types = await tx.select().from(assessmentTypes)
        .where(and(
          eq(assessmentTypes.id, assessmentTypeId),
          eq(assessmentTypes.organizationId, org.id),
          eq(assessmentTypes.active, true)
        ))
        .limit(1)
      const assessment = types[0]
      if (!assessment) throw createError({ statusCode: 404, statusMessage: 'Assessment type not found' })

      const activeUnits = await tx.select().from(units)
        .where(and(eq(units.organizationId, org.id), eq(units.status, 'active')))

      const created = []
      for (const unit of activeUnits) {
        const existing = await tx.select({ id: invoices.id }).from(invoices)
          .where(and(
            eq(invoices.organizationId, org.id),
            eq(invoices.unitId, unit.id),
            eq(invoices.assessmentTypeId, assessment.id),
            eq(invoices.period, period)
          ))
          .limit(1)
        if (existing[0]) continue

        const id = `inv-${crypto.randomUUID().slice(0, 8)}`
        const description = sanitizeText(`${assessment.name} — ${period}`, 512)
        const [row] = await tx.insert(invoices).values({
          id,
          organizationId: org.id,
          unitId: unit.id,
          assessmentTypeId: assessment.id,
          period,
          description,
          amount: assessment.defaultAmount,
          penaltyAmount: '0',
          amountPaid: '0',
          status: 'open',
          dueDate,
          issuedAt: new Date()
        }).returning()

        created.push({
          id: row!.id,
          organizationId: row!.organizationId,
          unitId: row!.unitId,
          assessmentTypeId: row!.assessmentTypeId ?? undefined,
          period: row!.period,
          description: row!.description,
          amount: String(row!.amount),
          penaltyAmount: String(row!.penaltyAmount),
          amountPaid: String(row!.amountPaid),
          status: row!.status,
          dueDate: String(row!.dueDate),
          issuedAt: row!.issuedAt.toISOString(),
          unitCode: unit.code
        })
      }

      return { invoices: created, generated: created.length }
    }
  )
})
