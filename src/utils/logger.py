#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Logger Module for Attendance System
This module provides a Logger class for configuring and managing logging
across the application. It uses the Singleton pattern to ensure a consistent
logging configuration throughout the system.
"""
import logging
import os
import sys
import threading
import time
from datetime import datetime, timedelta
import json
import re

from src.app.core.config import settings


class ColoredFormatter(logging.Formatter):
    """Custom formatter that adds colors to specific log messages."""
    
    # ANSI color codes
    GREEN = '\033[92m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    RESET = '\033[0m'
    
    # Green circle character
    GREEN_CIRCLE = '🟢'
    # Blue circle character
    BLUE_CIRCLE = '🔵'
    
    # Track if attendance was actually recorded (not on cooldown)
    _attendance_recorded = False
    
    def format(self, record):
        # Get the original formatted message
        msg = super().format(record)
        
        # Simple coloring for INFO/WARNING/ERROR
        if record.levelno == logging.INFO:
            pass # Default color
        elif record.levelno == logging.WARNING:
            msg = f"\033[93m{msg}\033[0m"
        elif record.levelno == logging.ERROR:
            msg = f"\033[91m{msg}\033[0m"
        
        return msg

class Logger:
    """
    Class to configure and manage logging for the system.
    """
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Logger, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        """Initialize the Logger."""
        if hasattr(self, '_initialized') and self._initialized:
            return
            
        self._initialized = True
        
        # Get the project root directory
        project_root = os.getcwd()
        
        # Use Pydantic settings
        log_dir = settings.log_dir
        
        # Ensure log paths are absolute
        log_dir_abs = os.path.join(project_root, log_dir)
        os.makedirs(log_dir_abs, exist_ok=True)

        self.app_log_path = os.path.join(log_dir_abs, 'application.log')
        
        # Configure logging
        logging.basicConfig(
            level=getattr(logging, settings.log_level.upper()),
            format=settings.log_format,
            handlers=[
                logging.StreamHandler(sys.stdout),
                logging.FileHandler(self.app_log_path, mode='a', encoding='utf-8')
            ]
        )
        
        logging.info("Logger initialized")
