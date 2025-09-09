#!/usr/bin/env python3
"""
Script to add UthmanicHafs1Ver18.ttf to the Xcode project
"""

import re
import uuid

def generate_uuid():
    """Generate a UUID for Xcode project"""
    return str(uuid.uuid4()).replace('-', '').upper()

def add_font_to_xcode_project():
    project_file = 'ios/IQRA2.xcodeproj/project.pbxproj'
    
    # Read the project file
    with open(project_file, 'r') as f:
        content = f.read()
    
    # Generate UUIDs for the new font
    font_ref_id = generate_uuid()
    build_file_id = generate_uuid()
    
    # Add the font file reference (after KSAHeavy.ttf)
    font_ref_pattern = r'(52C00D17AFA24336AA59F63A /\* KSAHeavy\.ttf \*/ = \{isa = PBXFileReference;.*?sourceTree = "<group>"; \};)'
    font_ref_replacement = f'''\\1
                {font_ref_id} /* UthmanicHafs1Ver18.ttf */ = {{isa = PBXFileReference; explicitFileType = undefined; fileEncoding = 9; includeInIndex = 0; lastKnownFileType = unknown; name = "UthmanicHafs1Ver18.ttf"; path = "../src/assets/fonts/UthmanicHafs1Ver18.ttf"; sourceTree = "<group>"; }};'''
    
    content = re.sub(font_ref_pattern, font_ref_replacement, content, flags=re.DOTALL)
    
    # Add the font to the Resources group (after KSAHeavy.ttf)
    resources_group_pattern = r'(52C00D17AFA24336AA59F63A /\* KSAHeavy\.ttf \*/,)'
    resources_group_replacement = f'''\\1
                                {font_ref_id} /* UthmanicHafs1Ver18.ttf */,'''
    
    content = re.sub(resources_group_pattern, resources_group_replacement, content)
    
    # Add the build file reference (after KSAHeavy.ttf build file)
    build_file_pattern = r'(796D9C8EB21E4BF7A76348E4 /\* KSAHeavy\.ttf in Resources \*/ = \{isa = PBXBuildFile; fileRef = 52C00D17AFA24336AA59F63A /\* KSAHeavy\.ttf \*/; \};)'
    build_file_replacement = f'''\\1
                {build_file_id} /* UthmanicHafs1Ver18.ttf in Resources */ = {{isa = PBXBuildFile; fileRef = {font_ref_id} /* UthmanicHafs1Ver18.ttf */; }};'''
    
    content = re.sub(build_file_pattern, build_file_replacement, content, flags=re.DOTALL)
    
    # Add the font to the Resources build phase (after KSAHeavy.ttf)
    resources_build_pattern = r'(796D9C8EB21E4BF7A76348E4 /\* KSAHeavy\.ttf in Resources \*/,)'
    resources_build_replacement = f'''\\1
                                {build_file_id} /* UthmanicHafs1Ver18.ttf in Resources */,'''
    
    content = re.sub(resources_build_pattern, resources_build_replacement, content)
    
    # Write the updated project file
    with open(project_file, 'w') as f:
        f.write(content)
    
    print("✅ Successfully added UthmanicHafs1Ver18.ttf to Xcode project!")
    print(f"Font Reference ID: {font_ref_id}")
    print(f"Build File ID: {build_file_id}")

if __name__ == "__main__":
    add_font_to_xcode_project()
