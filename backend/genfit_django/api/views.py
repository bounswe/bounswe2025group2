from django.http.response import JsonResponse
from django.shortcuts import render
from django.contrib.auth import get_user_model


# Create your views here.


# create a mock view to display the users, also allow post requests

# to create a new user
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator


@require_http_methods(['GET', 'POST'])
def users(request):

    if request.method == 'POST':
        # handle post request to create a new user
        # get the data from the request
        data = request.POST
        # create a new user
        user = get_user_model().objects.create_user(
            username=data['username'],
            email=data['email'],
            password=data['password']
        )
        return JsonResponse({'status': 'success', 'user_id': user.id})

    else:

        # instead of rendering a template, we will return a json response
        users = get_user_model().objects.all()
        users_list = []
        for user in users:
            users_list.append({
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name
            })
        return JsonResponse(users_list, safe=False)




