import os, base64

class SessionStore:
    def __init__(self):
        self.session_data = {}

    def generate_session_id(self):
        rnum = os.urandom(32)
        encoded = base64.b64encode(rnum).decode('utf-8')
        return encoded
    
    def create_session(self):
        session_id = self.generate_session_id()
        self.session_data[session_id] = {}
        return session_id
    
    def get_session_data(self, session_id):
        if session_id in self.session_data:
            return self.session_data[session_id]
        else:
            return None