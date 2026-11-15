import { buildingHalfExtent } from './worldUnits.js'

const RANGE_EPS = 0.01

export function canAttackTarget(attacker, target) {
    return (
        attacker.type === 'unit' &&
        attacker.id !== target.id &&
        attacker.group !== target.group &&
        (attacker.stats?.attack ?? 0) > 0 &&
        (attacker.stats?.attackSpeed ?? 0) > 0
    )
}

export function distanceToSurface(from, target) {
    if (target.type === 'building') {
        const half = buildingHalfExtent(target.sizeN ?? 1)
        const dx = Math.max(Math.abs(from.wx - target.wx) - half, 0)
        const dy = Math.max(Math.abs(from.wy - target.wy) - half, 0)
        return Math.hypot(dx, dy)
    }
    return Math.max(Math.hypot(from.wx - target.wx, from.wy - target.wy) - target.radius, 0)
}

function attackGap(attacker, target) {
    return distanceToSurface(attacker, target) - attacker.radius
}

export function advanceCombat(objects, elapsedSeconds) {
    const byId = new Map(objects.map((object) => [object.id, object]))
    const destroyed = new Set()
    const dt = Math.max(0, elapsedSeconds)

    for (const attacker of objects) {
        if (attacker.type !== 'unit' || attacker.attackTargetId == null) continue

        const target = byId.get(attacker.attackTargetId)
        if (!target || destroyed.has(target.id) || !canAttackTarget(attacker, target)) {
            attacker.attackTargetId = null
            attacker.attackCooldown = 0
            continue
        }

        const range = attacker.stats.attackRange ?? 0

        const gap = attackGap(attacker, target)
        if (gap > range + RANGE_EPS && attacker.stats.speed > 0) {
            const dx = target.wx - attacker.wx
            const dy = target.wy - attacker.wy
            const distance = Math.hypot(dx, dy)
            if (distance > 0) {
                const move = Math.min(attacker.stats.speed * dt, gap - range)
                attacker.wx += (dx / distance) * move
                attacker.wy += (dy / distance) * move
            }
        }

        const interval = 1 / attacker.stats.attackSpeed
        let cooldown = (attacker.attackCooldown ?? 0) - dt
        while (
            cooldown <= 0 &&
            attackGap(attacker, target) <= range + RANGE_EPS &&
            target.stats.hp > 0
            ) {
            target.stats.hp = Math.max(0, target.stats.hp - attacker.stats.attack)
            cooldown += interval
        }
        attacker.attackCooldown = Math.max(0, cooldown)

        if (target.stats.hp <= 0) destroyed.add(target.id)
    }

    if (destroyed.size > 0) {
        for (const object of objects) {
            if (destroyed.has(object.attackTargetId)) {
                object.attackTargetId = null
                object.attackCooldown = 0
            }
        }
    }
    return [...destroyed]
}