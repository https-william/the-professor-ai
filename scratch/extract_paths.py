import re

def convert_svg_to_react(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    # Extract paths
    paths = re.findall(r'<path[^>]*>', content)
    react_paths = []
    
    for p in paths:
        d = re.search(r'd="([^"]*)"', p).group(1)
        fill = re.search(r'fill="([^"]*)"', p)
        fill_val = fill.group(1) if fill else "currentColor"
        
        # Determine monochrome fill
        # If it's a light color (like #f7f7f8), use var(--background)
        # Otherwise use currentColor
        if fill_val.lower() in ['#f7f7f8', '#ffffff', '#fff']:
            fill_attr = 'fill="var(--background)"'
        else:
            fill_attr = 'fill="currentColor"'
            
        opacity = re.search(r'opacity="([^"]*)"', p)
        opacity_attr = f' opacity="{opacity.group(1)}"' if opacity else ""
        
        react_paths.append(f'            <path d="{d}" {fill_attr}{opacity_attr} />')
        
    return "\n".join(react_paths)

if __name__ == "__main__":
    print(convert_svg_to_react('public/brand-logo-full.svg'))
