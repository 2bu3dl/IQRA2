#!/usr/bin/env python3

import re
import uuid

def add_bundle_to_xcode_project():
    project_file = 'ios/IQRA2.xcodeproj/project.pbxproj'
    
    # Read the project file
    with open(project_file, 'r') as f:
        content = f.read()
    
    # Generate unique IDs for the bundle file
    file_ref_id = str(uuid.uuid4()).replace('-', '').upper()[:24]
    build_file_id = str(uuid.uuid4()).replace('-', '').upper()[:24]
    
    # Find the main group section and add the bundle file reference
    main_group_pattern = r'(/\* Begin PBXGroup section \*/\s*[^}]*)(\s*/\* End PBXGroup section \*/)'
    
    # Add file reference to PBXFileReference section
    file_ref_pattern = r'(/\* Begin PBXFileReference section \*/\s*)(.*?)(\s*/\* End PBXFileReference section \*/)'
    
    # Add build file to PBXBuildFile section
    build_file_pattern = r'(/\* Begin PBXBuildFile section \*/\s*)(.*?)(\s*/\* End PBXBuildFile section \*/)'
    
    # Add to resources build phase
    resources_pattern = r'(/\* Resources \*/\s*)(.*?)(\s*/\* End Resources \*/)'
    
    # File reference entry
    file_ref_entry = f'''		{file_ref_id} /* main.jsbundle */ = {{isa = PBXFileReference; lastKnownFileType = text; path = "main.jsbundle"; sourceTree = "<group>"; }};'''
    
    # Build file entry
    build_file_entry = f'''		{build_file_id} /* main.jsbundle in Resources */ = {{isa = PBXBuildFile; fileRef = {file_ref_id} /* main.jsbundle */; }};'''
    
    # Add file reference
    if file_ref_entry not in content:
        content = re.sub(
            file_ref_pattern,
            r'\1' + file_ref_entry + '\n\2\3',
            content,
            flags=re.DOTALL
        )
    
    # Add build file
    if build_file_entry not in content:
        content = re.sub(
            build_file_pattern,
            r'\1' + build_file_entry + '\n\2\3',
            content,
            flags=re.DOTALL
        )
    
    # Add to resources build phase
    resources_entry = f'''				{build_file_id} /* main.jsbundle in Resources */,'''
    if resources_entry not in content:
        content = re.sub(
            resources_pattern,
            r'\1' + resources_entry + '\n\2\3',
            content,
            flags=re.DOTALL
        )
    
    # Add to main group
    main_group_entry = f'''				{file_ref_id} /* main.jsbundle */,'''
    if main_group_entry not in content:
        # Find the main group and add the bundle
        main_group_match = re.search(r'(/\* Begin PBXGroup section \*/\s*[^}]*)(\s*/\* End PBXGroup section \*/)', content, re.DOTALL)
        if main_group_match:
            main_group_content = main_group_match.group(1)
            # Find the main group (usually the first group with children)
            main_group_pattern = r'(/\* Begin PBXGroup section \*/\s*[^}]*children = \(\s*)(.*?)(\s*\);.*?/\* End PBXGroup section \*/)'
            main_group_match = re.search(main_group_pattern, content, re.DOTALL)
            if main_group_match:
                children_content = main_group_match.group(2)
                if main_group_entry not in children_content:
                    new_children = main_group_entry + '\n' + children_content
                    content = content.replace(children_content, new_children)
    
    # Write the updated content
    with open(project_file, 'w') as f:
        f.write(content)
    
    print("✅ Successfully added main.jsbundle to Xcode project")
    print(f"File reference ID: {file_ref_id}")
    print(f"Build file ID: {build_file_id}")

if __name__ == "__main__":
    add_bundle_to_xcode_project()