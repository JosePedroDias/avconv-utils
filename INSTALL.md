# how to install avconv with h264 support in ubuntu

kudos to this thread:
http://stackoverflow.com/questions/11234662/how-to-compile-avconv-with-libx264-on-ubuntu-12-04


1) download assembly compiler and create source dir

    sudo apt-get install yasm
    mkdir avconv-source


2) download and install the x264 library

    cd ~/avconv-source
    git clone git://git.videolan.org/x264.git x264
    cd x264
    sudo ./configure --enable-static
    sudo make
    sudo make install


3.) download the avconv source

    cd ~/avconv-source
    git clone git://git.libav.org/libav.git avconv
    cd avconv
    sudo ./configure
    sudo ./configure --enable-gpl --enable-libx264
    sudo make
    sudo make install
