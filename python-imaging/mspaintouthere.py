import numpy as np
import cv2
import pygame
import keyboard  

drawing = False
counter = 0
ix, iy = -1, -1
red = (0, 0, 255)
blue = (255, 0, 0)
green = (0, 255, 0)
yellow = (0, 255, 255)
colours = [red, blue, green, yellow]
history = [] #list to save previous iterations of the drawing

def draw_circle(event, x, y, flags, param):
    global ix, iy, drawing, counter, red, blue, green, yellow, colours, history

    if event == cv2.EVENT_LBUTTONDOWN:
        drawing = True
        ix, iy = x, y
        history.append(image.copy()) #saves image in list 

    elif event == cv2.EVENT_RBUTTONDOWN:
        counter = counter + 1
        if counter == 4:
            counter = 0

    elif event == cv2.EVENT_MOUSEMOVE:
        if drawing:
            cv2.circle(image, (x, y), 10, colours[counter], -10)

    elif event == cv2.EVENT_LBUTTONUP:
        drawing = False
        cv2.circle(image, (x, y), 10, colours[counter], -10)
    

image = np.zeros((512, 512, 3), np.uint8)
cv2.namedWindow('web')
cv2.setMouseCallback('web', draw_circle)

while(True):
    cv2.imshow('web', image)
    k = cv2.waitKey(1) & 0xFF

    if k == ord('u'): # press 'u' to undo
        if history:
            image = history.pop()

    elif k == 27:
        break

cv2.destroyAllWindows()


