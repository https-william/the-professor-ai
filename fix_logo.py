import re
import os

path = r'c:\Users\cutef\Downloads\My Projects\the-professor\src\components\ui\BrandLogo.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace hex fills
content = re.sub(r'fill="#[a-fA-F0-9]{6}"', 'fill="currentColor"', content)

# Fix structure
# The file has: <><svg [PROPS1] /><svg [PROPS2]>...paths...</svg></>
# We want: <svg [PROPS1] [PROPS2]>...paths...</svg>

# 1. Extract props from the first (self-closing) SVG
first_svg_match = re.search(r'<svg\s+([^>]+?)\s*/>', content)
if first_svg_match:
    props1 = first_svg_match.group(1).strip()
    
    # 2. Remove the fragment start and the first SVG
    content = re.sub(r'<><svg[^>]+?/>', '', content)
    
    # 3. Remove the fragment end
    content = content.replace('</svg></>', '</svg>')
    
    # 4. Find the remaining <svg tag and merge props
    # props1 contains things like width, height, className, style, aria-label
    # the second <svg tag has xmlns, fillRule, clipRule, imageRendering, shapeRendering, textRendering, version, viewBox
    
    # We'll just prepend props1 to the second svg's attributes
    content = re.sub(r'<svg\s+', f'<svg {props1} ', content, count=1)

# Ensure only ONE xmlns and viewBox if they are duplicated
# Actually props1 has width, height, viewBox, fill, xmlns, className, style, aria-label
# props2 has xmlns, fillRule, clipRule, imageRendering, shapeRendering, textRendering, version, viewBox
# We should probably deduplicate or just be careful.

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
