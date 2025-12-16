# api/separate_views/report_views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from ..models import Report
from ..serializers import ReportSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_report(request):
    """Create a new report"""
    serializer = ReportSerializer(data=request.data, context={'request': request})
    
    if serializer.is_valid():
        serializer.save()
        return Response({
            'status': 'success',
            'message': 'Report submitted successfully. We will review it shortly.',
            'report_id': serializer.data['id']
        }, status=status.HTTP_201_CREATED)
    else:
        return Response({
            'status': 'error',
            'message': 'Please correct the errors below.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_reports(request):
    """Get all reports submitted by the current user"""
    reports = Report.objects.filter(reporter=request.user)
    serializer = ReportSerializer(reports, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_report_detail(request, report_id):
    """Get details of a specific report"""
    report = get_object_or_404(Report, id=report_id, reporter=request.user)
    serializer = ReportSerializer(report)
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_report(request, report_id):
    """Delete a report (only if pending)"""
    report = get_object_or_404(Report, id=report_id, reporter=request.user)
    
    # Only allow deletion if report is still pending
    if report.status != 'pending':
        return Response({
            'error': 'Cannot delete report that has already been reviewed'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    report.delete()
    return Response({
        'message': 'Report deleted successfully'
    }, status=status.HTTP_200_OK)


# Admin endpoints (restrict to staff users)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_reports(request):
    """Get all reports (admin only)"""
    if not request.user.is_staff:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    status_filter = request.query_params.get('status', None)
    reports = Report.objects.all()
    
    if status_filter:
        reports = reports.filter(status=status_filter)
    
    serializer = ReportSerializer(reports, many=True)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_report_status(request, report_id):
    """Update report status (admin only)"""
    if not request.user.is_staff:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    report = get_object_or_404(Report, id=report_id)
    
    # Update status
    new_status = request.data.get('status')
    admin_notes = request.data.get('admin_notes', '')
    
    if new_status and new_status in dict(Report.STATUS_CHOICES).keys():
        report.status = new_status
        report.admin_notes = admin_notes
        report.save()
        
        serializer = ReportSerializer(report)
        return Response({
            'message': f'Report status updated to {new_status}',
            'report': serializer.data
        })
    
    return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)