import cv2
import numpy as np
import pygame

camera = cv2.VideoCapture(0)

if not camera.isOpened():
    raise Exception("Could not open video device")

ret, frame = camera.read()

if ret:
    cv2.imshow("webcam", frame)

    cv2.imwrite("webcam_screenshot.png", frame) #saves captured frame

    cv2.waitKey(0)
    cv2.destroyAllWindows()

else:
    print("Failed to capture image")

camera.release()


