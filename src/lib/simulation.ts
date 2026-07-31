import type {
  ArenaRecord,
  BrainType,
  CellType,
  SimAgent,
  SimFrame,
} from "$lib/types";

const directions = [
  { x: 1, z: 0 },
  { x: -1, z: 0 },
  { x: 0, z: 1 },
  { x: 0, z: -1 },
];

const key = (x: number, z: number) => `${x}:${z}`;

function hash(value: number) {
  const result = Math.sin(value * 12.9898) * 43758.5453;
  return result - Math.floor(result);
}

function distance(a: { x: number; z: number }, b: { x: number; z: number }) {
  return Math.abs(a.x - b.x) + Math.abs(a.z - b.z);
}

function chooseTarget(
  brain: BrainType,
  options: Array<{ x: number; z: number }>,
  agent: SimAgent,
  food: Set<string>,
  cells: Map<string, CellType>,
  tick: number,
) {
  const ranked = options.map((option, index) => {
    const type = cells.get(key(option.x, option.z));
    const visitPenalty = agent.visits[key(option.x, option.z)] ?? 0;
    const nearestFood = [...food].reduce((best, item) => {
      const [x, z] = item.split(":").map(Number);
      return Math.min(best, distance(option, { x, z }));
    }, 999);
    const goals = [...cells.entries()].filter(([, cellType]) => cellType === "goal");
    const nearestGoal = goals.reduce((best, [item]) => {
      const [x, z] = item.split(":").map(Number);
      return Math.min(best, distance(option, { x, z }));
    }, 999);

    let value = hash(tick * 97 + index * 31 + agent.id.length) * 2 - visitPenalty;
    if (brain === "collector") value += 12 - nearestFood * 2;
    if (brain === "seeker") value += 10 - nearestGoal * 1.6;
    if (brain === "survivor") value += type === "hazard" ? -100 : 2;
    if (brain === "explorer") value -= visitPenalty * 4;
    if (type === "food") value += 15;
    if (type === "goal") value += 20;
    return { option, value };
  });
  ranked.sort((a, b) => b.value - a.value);
  return ranked[0]?.option ?? { x: agent.x, z: agent.z };
}

export function createSimulation(arena: ArenaRecord): SimFrame[] {
  const initialFood = new Set(
    arena.cells.filter((cell) => cell.type === "food").map((cell) => key(cell.x, cell.z)),
  );
  const agents: SimAgent[] = arena.agents.map((agent, index) => ({
    ...agent,
    id: `${index}-${agent.name}`,
    energy: 100,
    score: 0,
    alive: true,
    thought: "Scanning the arena",
    visits: { [key(agent.x, agent.z)]: 1 },
  }));
  return [{ tick: 0, agents, food: [...initialFood], events: ["Simulation initialized"] }];
}

export function stepSimulation(arena: ArenaRecord, previous: SimFrame): SimFrame {
  const tick = previous.tick + 1;
  const cells = new Map(arena.cells.map((cell) => [key(cell.x, cell.z), cell.type]));
  const food = new Set(previous.food);
  const events: string[] = [];
  const occupied = new Set<string>();

  const agents = previous.agents.map((source) => {
    const agent: SimAgent = {
      ...source,
      visits: { ...source.visits },
    };
    if (!agent.alive) return agent;

    const options = directions
      .map((direction) => ({ x: agent.x + direction.x, z: agent.z + direction.z }))
      .filter(
        (position) =>
          position.x >= 0 &&
          position.z >= 0 &&
          position.x < arena.width &&
          position.z < arena.height &&
          cells.get(key(position.x, position.z)) !== "wall" &&
          !occupied.has(key(position.x, position.z)),
      );
    const target = chooseTarget(agent.brain, options, agent, food, cells, tick);
    agent.x = target.x;
    agent.z = target.z;
    agent.energy -= 2;
    agent.visits[key(agent.x, agent.z)] = (agent.visits[key(agent.x, agent.z)] ?? 0) + 1;
    const tile = cells.get(key(agent.x, agent.z));

    if (food.delete(key(agent.x, agent.z))) {
      agent.energy = Math.min(100, agent.energy + 30);
      agent.score += 25;
      agent.thought = "Found energy — seeking the next resource";
      events.push(`${agent.name} collected energy`);
    } else if (tile === "hazard") {
      agent.energy -= 35;
      agent.score = Math.max(0, agent.score - 10);
      agent.thought = "Hazard detected — rerouting";
      events.push(`${agent.name} hit a hazard`);
    } else if (tile === "goal") {
      agent.score += 50;
      agent.energy = Math.min(100, agent.energy + 10);
      agent.thought = "Objective reached — holding position";
      events.push(`${agent.name} reached the core`);
    } else {
      agent.score += 1;
      agent.thought =
        agent.brain === "collector"
          ? "Tracking the nearest energy signature"
          : agent.brain === "seeker"
            ? "Plotting a route to the core"
            : agent.brain === "survivor"
              ? "Avoiding high-risk terrain"
              : "Mapping an unexplored cell";
    }

    if (agent.energy <= 0) {
      agent.alive = false;
      agent.energy = 0;
      agent.thought = "Agent offline";
      events.push(`${agent.name} ran out of energy`);
    } else {
      occupied.add(key(agent.x, agent.z));
    }
    return agent;
  });

  return { tick, agents, food: [...food], events };
}

export function runSimulation(arena: ArenaRecord, maxTicks = 120) {
  const frames = createSimulation(arena);
  while (
    frames.length <= maxTicks &&
    frames.at(-1)?.agents.some((agent) => agent.alive) &&
    frames.at(-1)?.food.length
  ) {
    frames.push(stepSimulation(arena, frames.at(-1)!));
  }
  return frames;
}

export function frameScore(frame: SimFrame) {
  return frame.agents.reduce((total, agent) => total + agent.score, 0);
}
