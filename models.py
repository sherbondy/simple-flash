from google.appengine.ext import db

class CardSets(db.Model):
    user = db.UserProperty(required="True")
    title = db.TextProperty(default="")
    modified = db.DateTimeProperty(auto_now_add=True)
    content = db.TextProperty(default="")