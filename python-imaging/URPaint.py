import cv2
import time
import numpy as np

# Constants
DRAW_RADIUS = 10
COLOURS = [
    (0, 0, 255),      # red
    (0, 165, 255),    # orange
    (0, 255, 255),    # yellow
    (0, 255, 0),      # green
    (255, 0, 0),      # blue
    (238, 130, 238)   # purple
]

drawing = False
counter = 0
ix, iy = -1, -1
history = []

def convert_to_coloring_page(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    inv = 255 - gray
    blur = cv2.GaussianBlur(inv, (21, 21), 0)
    sketch = cv2.divide(gray, 255 - blur, scale=256.0)
    return cv2.cvtColor(sketch, cv2.COLOR_GRAY2BGR)

def draw_circle(event, x, y, flags, param):
    global ix, iy, drawing, counter, history
    image = param['image']
    if event == cv2.EVENT_LBUTTONDOWN:
        drawing = True
        ix, iy = x, y
        history.append(image.copy())
    elif event == cv2.EVENT_MOUSEMOVE and drawing:
        cv2.circle(image, (x, y), DRAW_RADIUS, COLOURS[counter], -1)
    elif event == cv2.EVENT_RBUTTONDOWN:
        counter = (counter + 1) % len(COLOURS)
    elif event == cv2.EVENT_LBUTTONUP:
        drawing = False
        cv2.circle(image, (x, y), DRAW_RADIUS, COLOURS[counter], -1)

def capture_image_from_webcam():
    webcam = cv2.VideoCapture(0)
    while True:
        ret, frame = webcam.read()
        cv2.imshow('webcam', frame)
        key = cv2.waitKey(1) & 0xFF
        if key == ord('p'):
            user_input = input("Enter file name: ").strip()
            if user_input == "":
                filename = f"webcam_screenshot_{int(time.time())}.png"
            else:
                filename = f"{user_input}.png"
            cv2.imwrite(filename, frame)
            print(f"Image saved as {filename}")
            break
        elif key == ord('q'):
            break
    webcam.release()
    cv2.destroyAllWindows()
    return frame

def start_drawing(image):
    global history
    history = []
    cv2.namedWindow('Coloring Page')
    cv2.setMouseCallback('Coloring Page', draw_circle, param={'image': image})
    while True:
        cv2.imshow('Coloring Page', image)
        key = cv2.waitKey(1) & 0xFF
        if key == ord('u') and history:
            image[:] = history.pop()
        elif key == 27:  # ESC key
            break
    cv2.destroyAllWindows()

def main():
    frame = capture_image_from_webcam()
    coloring_page = convert_to_coloring_page(frame)
    start_drawing(coloring_page)

if __name__ == '__main__':
    main()


