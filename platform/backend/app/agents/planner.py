"""Read/propose-only planner adapted from BarEx af57036 planning_agent:47–61."""
from app.agents.tutor import build_tutor
from app.agents.tools import next_options

def build_planner(model, limits):
    agent = build_tutor(model, limits)
    agent.name = 'Mitooni learning planner'
    agent.tools = [next_options]
    agent.instructions += '\nPropose a permitted next learning choice using next_options. Never apply a plan or assert mastery.'
    return agent
