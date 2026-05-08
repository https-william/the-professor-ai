import re

with open("Professor LOGO.svg", "r") as f:
    content = f.read()

# Convert dash-case attributes to camelCase
def dash_to_camel(match):
    return match.group(1) + match.group(2).upper()

content = re.sub(r'([a-z])-([a-z])', dash_to_camel, content)

# Special cases
content = content.replace('class="', 'className="')

with open("scratch/ProfessorLOGO.jsx", "w") as f:
    f.write(content)
