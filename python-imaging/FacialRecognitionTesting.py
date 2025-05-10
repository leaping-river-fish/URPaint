import cv2
import torch
import torchvision
import torch.nn as nn
import torchvision.transforms as transforms
from torchvision.models import resnet18, ResNet18_Weights

resnet18(weights=ResNet18_Weights.DEFAULT)

class FaceRecognitionModel(nn.Module) : # loading pretrained model
    def __init__(self):
        super(FaceRecognitionModel, self).__init__()
        self.model = resnet18(weights=ResNet18_Weights.DEFAULT)
        self.model.fc == nn.Linear(self.model.fc.in_features, 128)

    def forward(self, x) :
        return self.model(x)

model = FaceRecognitionModel()
model.eval() # setting model to evaluation mode

# opencv face detector
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

#defining processing
transform = transforms.Compose([
    transforms.ToPILImage(),
    transforms.Resize((224,224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])


def webcapture_recognition(): # Capturing webcam video

    webcam = cv2.VideoCapture(0)

    if not webcam.isOpened():
        raise Exception("Could not open video device")

    while(True):
        ret, frame = webcam.read()

        if not ret:
            print("Error: Failed to capture frame.")
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)

        for(x, y, w, h) in faces :

            cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 0, 0), 2)

            face = frame[y:y+h, x:x+w]
            face_tensor = transform(face).unsqueeze(0)

            with torch.no_grad() :
                embedding = model(face_tensor)
                print(f'Embedding: {embedding}')

        cv2.imshow('Face Recognition', frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):

            break 

    webcam.release()
    cv2.destroyAllWindows()

webcapture_recognition()




