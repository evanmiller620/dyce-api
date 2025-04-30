import json

with open('sbom.json', 'r') as f:
    data = json.load(f)
components = data.get('bom', {}).get('components', {}).get('component', [])
licenses = set()

for component in components:
    license_info = component.get('licenses', {}).get('license')
    if isinstance(license_info, dict):
        license_name = license_info.get('name')
        if license_name:
            licenses.add(license_name)
    elif isinstance(license_info, list):
        for lic in license_info:
            name = lic.get('name')
            if name:
                licenses.add(name)

print("Unique Licenses:")
for lic in sorted(licenses):
    print(f"- {lic}")