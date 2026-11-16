import {ensureMovePath, findPathAroundObjects, segmentBlockedByObjects} from './pathfinding.js'

function segmentWouldEnterObject(unit, ax, ay, bx, by, objects) {
    return segmentBlockedByObjects(
        ax,
        ay,
        bx,
        by,
        unit.radius ?? 16,
        objects,
        unit.id
    )
}

function moveAlongPath(unit, path, elapsedSeconds, objects) {
    let remaining = Math.max(0, unit.stats.speed || 0) * elapsedSeconds

    while (remaining > 0 && path.length > 0) {
        const waypoint = path[0]

        const dx = waypoint.wx - unit.wx
        const dy = waypoint.wy - unit.wy
        const distance = Math.hypot(dx, dy)

        if (distance <= 0.00001) {
            unit.wx = waypoint.wx
            unit.wy = waypoint.wy
            path.shift()
            continue
        }

        if (
            segmentWouldEnterObject(
                unit,
                unit.wx,
                unit.wy,
                waypoint.wx,
                waypoint.wy,
                objects
            )
        ) {
            return 'blocked'
        }

        const step = Math.min(distance, remaining)

        unit.wx += (dx / distance) * step
        unit.wy += (dy / distance) * step

        remaining -= step

        if (step >= distance - 0.00001) {
            unit.wx = waypoint.wx
            unit.wy = waypoint.wy
            path.shift()
        }
    }

    return path.length === 0 ? 'arrived' : 'moving'
}

function invalidatePath(event) {
    event.path = null
    event._pathObjectsSig = null
}

export function calculateNextFrame(objects, queues, elapsedSeconds) {
    const nextObjects = objects.map((item) => ({
        ...item,
        stats: {...item.stats},
        destination: item.destination && {...item.destination},
    }))
    const nextQueues = Object.fromEntries(
        Object.entries(queues).map(([id, queue]) => [id, queue.map((event) => ({...event}))]),
    )

    for (const unit of nextObjects) {
        const queue = nextQueues[unit.id]
        if (unit.type !== 'unit' || !queue?.length || unit.stats.hp <= 0) continue
        const event = queue[0]

        if (event.type === 'attack') {
            unit.destination = null
            const target = nextObjects.find((item) => item.id === event.targetId && item.stats?.hp > 0)

            if (!target || target.group === unit.group) {
                queue.shift()
                continue
            }
            const range =
                (unit.radius ?? 16) +
                (target.type === 'building' ? (target.sizeN ?? 1) * 20 : target.radius ?? 16) +
                10
            const distance = Math.hypot(target.wx - unit.wx, target.wy - unit.wy)
            if (distance <= range) {
                event.cooldown = (event.cooldown ?? 0) - elapsedSeconds
                const period = 1 / Math.max(0.01, unit.stats.attackSpeed || 1)
                while (event.cooldown <= 0 && target.stats.hp > 0) {
                    target.stats.hp = Math.max(0, target.stats.hp - (unit.stats.attack || 0))
                    event.cooldown += period
                }
                if (target.stats.hp <= 0) queue.shift()
            } else {
                const path = findPathAroundObjects(
                    unit.wx,
                    unit.wy,
                    target.wx,
                    target.wy,
                    nextObjects,
                    unit.radius ?? 16,
                    unit.id
                )
                if (path.length > 0) {
                    moveAlongPath(unit, path, elapsedSeconds, nextObjects)
                }
            }
            continue
        }

        if (event.type !== 'move') {
            queue.shift()
            continue
        }

        const path = ensureMovePath(event, unit, nextObjects)

        if (!path.length) {
            const atGoal = Math.hypot(event.wx - unit.wx, event.wy - unit.wy) <= 0.00001
            if (atGoal) {
                unit.wx = event.wx
                unit.wy = event.wy
            }
            queue.shift()
            unit.destination = queue[0]?.type === 'move' ? {wx: queue[0].wx, wy: queue[0].wy} : null
            continue
        }

        const status = moveAlongPath(unit, path, elapsedSeconds, nextObjects)
        if (status === 'blocked') {
            invalidatePath(event)
        } else if (status === 'arrived') {
            queue.shift()
        }

        unit.destination = queue[0]?.type === 'move' ? {wx: queue[0].wx, wy: queue[0].wy} : null
    }

    const alive = nextObjects.filter((item) => item.stats?.hp > 0)
    for (const id of Object.keys(nextQueues)) {
        if (!alive.some((item) => item.id === id)) delete nextQueues[id]
    }
    return {objects: alive, queues: nextQueues}
}

export function winnerFor(objects, started) {
    if (!started) return null
    const groups = new Set(
        objects
            .filter((item) => (item.type === 'unit' || item.type === 'building') && item.stats?.hp > 0)
            .map((item) => item.group),
    )
    return groups.size <= 1 ? [...groups][0] ?? 'draw' : null
}

