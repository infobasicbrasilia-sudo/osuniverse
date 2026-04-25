from flask import Flask, render_template

app = Flask(__name__)

print("🚀 Iniciando Simulador Windows 11...")

@app.route("/")
def index():
    print("🟢 Abrindo tela inicial")
    return render_template("index.html")

@app.route("/bios")
def bios():
    print("🟢 Abrindo BIOS")
    return render_template("bios.html")

@app.route("/boot")
def boot():
    print("🟢 Boot Windows")
    return render_template("boot.html")

@app.route("/lockscreen")
def lockscreen():
    print("🟢 Tela bloqueio")
    return render_template("lockscreen.html")

@app.route("/desktop")
def desktop():
    print("🟢 Desktop Windows")
    return render_template("desktop.html")

@app.route("/explorer")
def explorer():
    print("🟢 Explorer aberto")
    return render_template("explorer.html")

@app.route("/cmd")
def cmd():
    print("🟢 CMD aberto")
    return render_template("cmd.html")

@app.route("/word")
def word_simulator():
    return render_template("word.html")

@app.route("/chrome")
def chrome():
    return render_template("chrome.html")

@app.route("/notepad")
def notepad():
    return render_template("notepad.html")


if __name__ == "__main__":
    print("🚀 Simulador Windows 11 Online")
    app.run(debug=True, port=8000)