from application.extensions import jinja


def init_controllers(app):
    import application.controllers.user_api
    import application.controllers.app_api
    import application.controllers.notify
    import application.controllers.upload
    import application.controllers.forgot_password


    import application.controllers.inventory.administrativeunits
    import application.controllers.inventory.organization
    import application.controllers.inventory.inventory
    import application.controllers.inventory.warehouse
    import application.controllers.inventory.currency
    import application.controllers.inventory.consumablesupplies
    import application.controllers.inventory.goodsreciept
    import application.controllers.inventory.activitylog
    import application.controllers.inventory.payment
    import application.controllers.inventory.purchaseorder
    import application.controllers.inventory.workstation 
    import application.controllers.inventory.movewarehouse
    # import application.controllers.notify_inventory

    @app.route('/')
    def index(request):
        return jinja.render('index.html', request)
