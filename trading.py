import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# Load the dataset
df = pd.read_csv('option_trading.csv')

# Split the data into input and target variables
X = df.drop('Option Type', axis=1)
y = df['Option Type']

# Handle missing values and encode categorical variables (if any)
X = X.fillna(X.mean())
X = pd.get_dummies(X)

# Scale the input features
scaler = StandardScaler()
X = scaler.fit_transform(X)

# Split the data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
