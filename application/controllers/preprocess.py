# -*- coding: utf-8 -*-
from gatco_restapi import ProcessingException
from application.models.user import *
from application.database import db
from application.extensions import auth


def current_user(request):
    uid = auth.current_user(request)
    if uid is not None:
        user = couchdb.db.get_query_result({'doc_type': 'user', '_id': uid}, raw_result=True)
        return user
    return None;


def auth_func(request=None, **kw):
    uid = auth.current_user(request)
    if uid is None:
        raise ServerError("API.py auth_func can not found uid")


def deny_func(request=None, **kw):
    raise ServerError("Permission denied")


def role_prepost(**kw):
    request = kw.get("request", None)
    currentUser = current_user(request)
    if currentUser is not None:
        if not currentUser.has_role('Admin'):
            pass
            # raise ProcessingException(description='User does not have privileges',code=401)
    else:
        raise ProcessingException(description='User is not login', code=401)


def role_prepush_single(**kw):
    request = kw.get("request", None)
    currentUser = current_user(request)
    if currentUser is not None:
        if not currentUser.has_role('Admin'):
            raise ProcessingException(description='User does not have privileges', code=401)
    else:
        raise ProcessingException(description='User is not login', code=401)


def role_pregetmany(search_params=None, **kw):
    search_params["filters"] = {"$and": [search_params["filters"], {"id": {"$neq": 1}}]} if ("filters" in search_params) \
        else {"id": {"$neq": 1}}


def user_pregetmany(search_params, Model, **kw):
    request = kw.get("request", None)
    currentUser = current_user(request)
    if currentUser is not None:
        if currentUser.has_role('Admin'):
            print("user_pregetmany=============== is Admin")
        #         pass
        elif currentUser.has_role('TenancyAdmin'):
            search_params["filters"] = {"$and": [search_params["filters"], {"tenancy_id": {"$eq": currentUser.tenancy_id}}]} if ("filters" in search_params) \
                else {"tenancy_id": {"$eq": currentUser.tenancy_id}}
        else:
            search_params["filters"] = ("filters" in search_params) and {"$and": [search_params["filters"], {"id": {"$eq": currentUser.id}}]} \
                                       or {"id": {"$eq": currentUser.id}}

def tenancy_pre(**kw):
    request = kw.get("request", None)
    currentUser = current_user(request)
    if not (currentUser is not None and currentUser.has_role('Admin')):
        raise ProcessingException(description='Not authorized', code=401)


def tenancy_pregetmany(search_params=None, **kw):
    request = kw.get("request", None)
    currentUser = current_user(request)
    if currentUser is not None:
        if currentUser.has_role('Admin'):
            print('tenancy_pregetmany has_role is Admin')
        else:
            search_params["filters"] = {"$and": [search_params["filters"], {"id": {"$eq": currentUser.tenancy_id}}]} if ("filters" in search_params) \
                else {"id": {"$eq": currentUser.tenancy_id}}
            print(currentUser.tenancy_id)


