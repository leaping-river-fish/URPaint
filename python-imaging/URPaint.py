import cv2
import numpy as np
import pygame
import matplotlib as plt

drawing = False
counter = 0
ix, iy = -1, -1
red = (0, 0, 255)
blue = (255, 0, 0)
green = (0, 255, 0)
yellow = (0, 255, 255)
orange = (0, 165, 255)
purple = (238, 130, 238)
colours = [red, orange, yellow, green, blue, purple]
history = []

webcam = cv2.VideoCapture(0)

while(True):
    ret, frame = webcam.read()
    display = cv2.imshow('webcam', frame)

    if cv2.waitKey(1) & 0Xff == ord('p'):

        cv2.imwrite("webcam_screenshot.png", frame)

        cv2.waitKey(0)
        cv2.destroyAllWindows()

    elif cv2.waitKey(1) & 0xFF == ord('q'):

        break 

webcam.release()

def draw_circle(event, x, y, flags, param):
    global ix, iy, drawing, counter, red, blue, green, yellow, orange, purple, colours, history, image

    if event == cv2.EVENT_LBUTTONDOWN:
        drawing = True
        ix, iy = x, y
        history.append(image.copy())
    
    elif event == cv2.EVENT_MOUSEMOVE:
        if drawing:
            cv2.circle(image, (x, y), 10, colours[counter], -10)

    elif event == cv2.EVENT_RBUTTONDOWN:
        counter = counter + 1
        if counter == 6:
            counter = 0

    elif event == cv2.EVENT_LBUTTONUP:
        drawing = False
        cv2.circle(image, (x, y), 10, colours[counter], -10)

image = cv2.imread("webcam_screenshot.png")
cv2.namedWindow('screenshot')
cv2.setMouseCallback('screenshot', draw_circle)

while(True):
    cv2.imshow('screenshot', image)
    i = cv2.waitKey(1) & 0xFF

    if i == ord('u'):
        if history:
            image = history.pop()

    elif i == 27:
        break

cv2.destroyAllWindows()


