import pandas as pd
from PIL import Image, ImageDraw, ImageFont
import os
from datetime import datetime
import easygui as gui


def insert_name(image_path, name) : #returns Named Image:
    #Load image and font file
    i = 0
    #Find the best available font for the given text
    while True:
        i+=10
        img = Image.open(image_path).convert("RGBA")
        size = 90
        font = ImageFont.truetype("Fonts/times.ttf",size-i)
        left, top, right, bottom = font.getbbox(name)
        width, height = right - left, bottom - top 
        draw = ImageDraw.Draw(img)
        #Calculate the position of text on the image based on its size
        pos = (((img.width - width)/2), (362)+i//2)
        if pos[0]>120:
            break
    #Adding the text to the image
    draw.text(pos, name, fill=(0,0,0), font=font)
    #Save the modified image with added text
    return img

def insert_text(image, course, From, to, gpa): # returns Content + Name:
    text = f"""For successful completion of four months training in "{course}" from {From.replace('"','')} to {to.replace('"',"")} securing {gpa} GPA, attending the mandatory "Life Skills Training" sessions, and completing the services to community launched by SURE Trust"""
    font = ImageFont.truetype("Fonts/EBGaramond-Regular.ttf", 30)
    draw = ImageDraw.Draw(image)
    img = image
    x = 181
    y = 497
    lines = []
    current_line = ""
    words = text.split(" ")
    for word in words:
        
        l,t,r,b = font.getbbox(current_line + word)
        text_width = abs(r-l)
        if text_width < img.width - x - 100:  # 80 is for some padding
            current_line += word + " "
        else:
            lines.append(current_line.strip())
            current_line = word + " "
    lines.append(current_line.strip())

    for line in lines:
        l,t,r,b = font.getbbox(line)
        text_width = abs(r-l)
        text_height = abs(t-b)
        # text_width, text_height = draw.textsize(line, font)
        draw.text((x, y), line, fill=(0, 0, 0), font=font)
        y += text_height  # Move to the next line
        y += 11 
    return image

if  __name__ == '__main__':
    graduation_folder_name = "12th Graduation Certificates" #Change  this according to Graduation NUmber
    if gui.boolbox(f"Is {graduation_folder_name} Folder name correct path?", "Graduation Folder Name", ("Yes", "No")):
        data = pd.read_excel("sample.xlsx", sheet_name="Sheet1")
        for  _,row in data.iterrows():
            if not os.path.exists(f"{graduation_folder_name}/{row['Batch Initials & Name']}"):
                os.makedirs(f"{graduation_folder_name}/{row['Batch Initials & Name']}")
            path = os.path.join('Templates', row['Template'])
            print(row)
            name_image = insert_name(path, row["Title"] + "." + row["Full_Name"])
            content_image = insert_text(name_image, row["Domain"], row["From"], row["To"], row["Gpa"])
            content_image.save(f"{graduation_folder_name}/{row['Batch Initials & Name']}/{row['Email']}.png")
        gui.msgbox("Certificates are generated... \nThank You!💌", title="Thank you")
    else:
        gui.msgbox("Please Update Graduation folder path.")