import os.path, cgi
from types import *
from datetime import datetime

from google.appengine.api import users
import webapp2

from jinja2 import Environment, FileSystemLoader, TemplateNotFound
from models import CardSets

def verifySet(content):
    cards = []

    for (i, pair) in enumerate(content.split("\n")):
        pair = pair.split(":")
        if pair:
            try:
                cards.append([pair[0],pair[1]])
            except IndexError:
                return "Formatting error on line "+str(i+1)
    return cards


class BasePage(webapp2.RequestHandler):
    def get(self):
        user = users.get_current_user()

    def render(self, template_name, **kwargs):
        logged_in = False

        user = users.get_current_user()
        if user:
            logged_in = True

        values = {"logged_in": logged_in,
                  "logout": users.create_logout_url("/")}
        values.update(kwargs)
        template_dirs = []
        template_dirs.append(os.path.join(os.path.dirname(__file__), 'templates'))
        env = Environment(loader = FileSystemLoader(template_dirs))
        try:
            template = env.get_template(template_name)
        except TemplateNotFound:
            raise TemplateNotFound(template_name)
        content = template.render(values)
        self.response.out.write(content)

class ListSets(BasePage):
    def get(self):
        user = users.get_current_user()

        if not user:
            self.redirect(users.create_login_url("/"))
        else:
            q = CardSets.all()
            q.filter('user = ', user)
            q.order("-modified")
            results = q.fetch(50)
            for item in results:
                item.content = item.content.replace("\n", ", ")

            self.render("index.html",
                        sets = results)

class ViewSet(BasePage):
    def get(self, id):
        creator = False

        result = CardSets.get_by_id(int(id))

        title = result.title

        user = users.get_current_user()

        if user == result.user:
            creator = True

        if result:
            content = verifySet(result.content)
            self.render("view.html",
                        title=title,
                        creator=creator,
                        id=id,
                        cards=content)

class NewSet(BasePage):
    def get(self):
        user = users.get_current_user()

        if not user:
            self.redirect(users.create_login_url("/"))
        else:
            self.render("edit.html",
                        action="new")

    def post(self):
        user = users.get_current_user()

        if not user:
            self.redirect(users.create_login_url("/"))
        else:
            title = cgi.escape(self.request.get("title"))
            content = cgi.escape(self.request.get("content"))

            output = verifySet(content)

            if type(output) is ListType:
                result = CardSets(user=user,
                                  title=title,
                                  content=content)
                result.put()
                id = result.key().id()
                self.redirect("/set/"+str(id))
            else:
                error = output
                self.render("edit.html",
                            title=title,
                            content=content,
                            error=error,
                            action="new")

class EditSet(BasePage):
    def get(self, id):
        result = CardSets.get_by_id(int(id))

        creator = False
        user = users.get_current_user()

        if user and result:
            if user == result.user:
                creator = True

            content = result.content
            output = verifySet(content)

            rows = 6
            if len(output) > 6:
                rows = len(output)

            self.render("edit.html",
                        action="edit/"+id,
                        creator=creator,
                        title = result.title,
                        rows = rows,
                        content=content)
        else:
            self.redirect("/")

    def post(self, id):
        user = users.get_current_user()

        if not user:
            self.redirect(users.create_login_url("/"))
        else:
            result = CardSets.get_by_id(int(id))

            creator = False
            # they're copying the set, not editing it
            if not user == result.user:
                result = CardSets(user=user)
            else:
                creator = True

            title = cgi.escape(self.request.get("title"))
            content = cgi.escape(self.request.get("content"))

            if content == "" and result.is_saved():
                result.delete()
                self.redirect("/")

            output = verifySet(content)

            if type(output) is ListType:
                result.title = title
                result.content = content
                result.modified = datetime.now()
                result.put()
                id = result.key().id()
                self.redirect("/set/"+str(id))
            else:
                error = output
                self.render("edit.html",
                            action="edit/"+str(id),
                            creator=creator,
                            title=title,
                            content=content,
                            error=error)

class Manifest(BasePage):
    def get(self):
        self.response.headers['Content-Type'] = "text/cache-manifest"
        self.render("cache.manifest")

application = webapp2.WSGIApplication([('/', ListSets),
                                        ('/new', NewSet),
                                        ('/set/(\d+)', ViewSet),
                                        ('/edit/(\d+)', EditSet),
                                        ('/cache.manifest', Manifest)],
                                       debug=True)

if __name__ == '__main__':
  main()
