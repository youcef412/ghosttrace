from flask import Flask, render_template, request

app = Flask(__name__)
USERS = {"ali": "1234"}

@app.route("/")
def home():
    return render_template("login.html")

@app.route("/login", methods=["POST"])
def login():
    username = request.form["username"]
    password = request.form["password"]  # BUG: KeyError 'password' (the form sends "pass")
    if USERS.get(username) == password:
        return "Welcome " + username
    return "Wrong credentials", 401

@app.route("/register")
def register():
    return render_template("register.html")

if __name__ == "__main__":
    app.run(debug=True)
