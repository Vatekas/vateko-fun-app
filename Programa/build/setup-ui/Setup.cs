using System;
using System.Management;
using System.Runtime.InteropServices;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Threading;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Input;
using System.Windows.Markup;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Threading;

internal static class Setup
{
	private enum T
	{
		Lang,
		Desc,
		Install,
		Installing,
		Done,
		Launch,
		Failed
	}

	private const string Xaml = "\r\n<Window xmlns='http://schemas.microsoft.com/winfx/2006/xaml/presentation' xmlns:x='http://schemas.microsoft.com/winfx/2006/xaml'\r\n        Title='Vateko.fun Setup' Width='666' Height='666' WindowStyle='None' ResizeMode='CanMinimize' WindowStartupLocation='CenterScreen'\r\n        Background='#04070E' BorderBrush='#2A3346' BorderThickness='1' UseLayoutRounding='True' TextOptions.TextRenderingMode='Grayscale'>\r\n  <Window.Resources>\r\n    <Style x:Key='Chrome' TargetType='Button'>\r\n      <Setter Property='Cursor' Value='Hand'/>\r\n      <Setter Property='Template'><Setter.Value>\r\n        <ControlTemplate TargetType='Button'>\r\n          <Border x:Name='bg' Background='Transparent' CornerRadius='6' Padding='{TemplateBinding Padding}'>\r\n            <ContentPresenter VerticalAlignment='Center' HorizontalAlignment='Center'/>\r\n          </Border>\r\n          <ControlTemplate.Triggers>\r\n            <Trigger Property='IsMouseOver' Value='True'><Setter TargetName='bg' Property='Background' Value='#14FFFFFF'/></Trigger>\r\n          </ControlTemplate.Triggers>\r\n        </ControlTemplate>\r\n      </Setter.Value></Setter>\r\n    </Style>\r\n    <Style x:Key='Glass' TargetType='Button'>\r\n      <Setter Property='Foreground' Value='White'/>\r\n      <Setter Property='FontSize' Value='15'/>\r\n      <Setter Property='FontWeight' Value='Bold'/>\r\n      <Setter Property='Cursor' Value='Hand'/>\r\n      <Setter Property='Template'><Setter.Value>\r\n        <ControlTemplate TargetType='Button'>\r\n          <Border x:Name='bg' CornerRadius='6' BorderThickness='1' BorderBrush='#3DFFFFFF' Background='#1FFFFFFF' Padding='25,13'>\r\n            <ContentPresenter HorizontalAlignment='Center'/>\r\n          </Border>\r\n          <ControlTemplate.Triggers>\r\n            <Trigger Property='IsMouseOver' Value='True'><Setter TargetName='bg' Property='Background' Value='#2EFFFFFF'/><Setter TargetName='bg' Property='BorderBrush' Value='#52FFFFFF'/></Trigger>\r\n            <Trigger Property='IsPressed' Value='True'><Setter TargetName='bg' Property='Background' Value='#1AFFFFFF'/></Trigger>\r\n            <Trigger Property='IsKeyboardFocused' Value='True'><Setter TargetName='bg' Property='BorderBrush' Value='#B3FFFFFF'/></Trigger>\r\n          </ControlTemplate.Triggers>\r\n        </ControlTemplate>\r\n      </Setter.Value></Setter>\r\n    </Style>\r\n    <Style x:Key='LangItem' TargetType='Button'>\r\n      <Setter Property='Foreground' Value='White'/>\r\n      <Setter Property='FontSize' Value='14'/>\r\n      <Setter Property='Cursor' Value='Hand'/>\r\n      <Setter Property='Template'><Setter.Value>\r\n        <ControlTemplate TargetType='Button'>\r\n          <Border x:Name='bg' Background='Transparent' CornerRadius='4' Padding='12,9'>\r\n            <ContentPresenter HorizontalAlignment='Left'/>\r\n          </Border>\r\n          <ControlTemplate.Triggers>\r\n            <Trigger Property='IsMouseOver' Value='True'><Setter TargetName='bg' Property='Background' Value='#1CFFFFFF'/></Trigger>\r\n            <Trigger Property='Tag' Value='on'><Setter TargetName='bg' Property='Background' Value='#2E3238'/></Trigger>\r\n          </ControlTemplate.Triggers>\r\n        </ControlTemplate>\r\n      </Setter.Value></Setter>\r\n    </Style>\r\n    <Style TargetType='CheckBox'>\r\n      <Setter Property='Foreground' Value='White'/>\r\n      <Setter Property='FontSize' Value='14'/>\r\n      <Setter Property='Cursor' Value='Hand'/>\r\n      <Setter Property='Template'><Setter.Value>\r\n        <ControlTemplate TargetType='CheckBox'>\r\n          <StackPanel Orientation='Horizontal' Background='Transparent'>\r\n            <Border x:Name='box' Width='22' Height='22' CornerRadius='4' BorderThickness='1' BorderBrush='#40FFFFFF' Background='#1FFFFFFF'>\r\n              <Path x:Name='tick' Data='M5,11 L9,15 L17,7' Stroke='White' StrokeThickness='2' Visibility='Collapsed' StrokeStartLineCap='Round' StrokeEndLineCap='Round'/>\r\n            </Border>\r\n            <ContentPresenter Margin='10,0,0,0' VerticalAlignment='Center'/>\r\n          </StackPanel>\r\n          <ControlTemplate.Triggers>\r\n            <Trigger Property='IsChecked' Value='True'><Setter TargetName='tick' Property='Visibility' Value='Visible'/></Trigger>\r\n            <Trigger Property='IsMouseOver' Value='True'><Setter TargetName='box' Property='BorderBrush' Value='#80FFFFFF'/></Trigger>\r\n          </ControlTemplate.Triggers>\r\n        </ControlTemplate>\r\n      </Setter.Value></Setter>\r\n    </Style>\r\n  </Window.Resources>\r\n  <Grid ClipToBounds='True'>\r\n    <Canvas IsHitTestVisible='False'>\r\n      <Ellipse x:Name='B1' Width='860' Height='640' Canvas.Left='-170' Canvas.Top='170'>\r\n        <Ellipse.Fill><RadialGradientBrush><GradientStop Color='#F02C66BC' Offset='0'/><GradientStop Color='#8A1F4F9A' Offset='.55'/><GradientStop Color='#001F4F9A' Offset='1'/></RadialGradientBrush></Ellipse.Fill>\r\n      </Ellipse>\r\n      <Ellipse x:Name='B2' Width='480' Height='440' Canvas.Left='400' Canvas.Top='80'>\r\n        <Ellipse.Fill><RadialGradientBrush><GradientStop Color='#C86E9EDC' Offset='0'/><GradientStop Color='#004A7CC4' Offset='1'/></RadialGradientBrush></Ellipse.Fill>\r\n      </Ellipse>\r\n      <Ellipse x:Name='B3' Width='560' Height='460' Canvas.Left='320' Canvas.Top='420'>\r\n        <Ellipse.Fill><RadialGradientBrush><GradientStop Color='#E0173F88' Offset='0'/><GradientStop Color='#00173F88' Offset='1'/></RadialGradientBrush></Ellipse.Fill>\r\n      </Ellipse>\r\n      <Ellipse x:Name='B4' Width='540' Height='440' Canvas.Left='120' Canvas.Top='160'>\r\n        <Ellipse.Fill><RadialGradientBrush><GradientStop Color='#A03E7BCC' Offset='0'/><GradientStop Color='#003E7BCC' Offset='1'/></RadialGradientBrush></Ellipse.Fill>\r\n      </Ellipse>\r\n    </Canvas>\r\n    <!-- dark top-left corner like Hydra -->\r\n    <Rectangle IsHitTestVisible='False'>\r\n      <Rectangle.Fill><LinearGradientBrush StartPoint='0,0' EndPoint='.85,.95'><GradientStop Color='#F805080F' Offset='0'/><GradientStop Color='#9005080F' Offset='.25'/><GradientStop Color='#0005080F' Offset='.55'/><GradientStop Color='#0005080F' Offset='.85'/><GradientStop Color='#3005080F' Offset='1'/></LinearGradientBrush></Rectangle.Fill>\r\n    </Rectangle>\r\n\r\n    <Button x:Name='Lang' Style='{StaticResource Chrome}' HorizontalAlignment='Left' VerticalAlignment='Top' Margin='14,14,0,0' Padding='10,6'>\r\n      <StackPanel Orientation='Horizontal'>\r\n        <Canvas Width='16' Height='16' VerticalAlignment='Center'>\r\n          <Ellipse Width='16' Height='16' Stroke='White' StrokeThickness='1.3'/>\r\n          <Ellipse Width='7' Height='16' Canvas.Left='4.5' Stroke='White' StrokeThickness='1.3'/>\r\n          <Line X1='0.5' Y1='8' X2='15.5' Y2='8' Stroke='White' StrokeThickness='1.3'/>\r\n        </Canvas>\r\n        <TextBlock x:Name='LangText' Margin='9,0,10,0' FontSize='14' FontWeight='Bold' Foreground='White' VerticalAlignment='Center'/>\r\n        <Path Data='M0,0 L4.5,4.5 L9,0' Stroke='White' StrokeThickness='1.3' VerticalAlignment='Center' RenderTransformOrigin='.5,.5'>\r\n          <Path.RenderTransform><ScaleTransform x:Name='Chev'/></Path.RenderTransform>\r\n        </Path>\r\n      </StackPanel>\r\n    </Button>\r\n    <Popup x:Name='LangPop' PlacementTarget='{Binding ElementName=Lang}' Placement='Bottom' HorizontalOffset='-4' VerticalOffset='6' StaysOpen='False' AllowsTransparency='True'>\r\n      <Border Background='#0B0E13' BorderBrush='#2A3039' BorderThickness='1' CornerRadius='8' Padding='7' Width='196'>\r\n        <StackPanel>\r\n          <Button x:Name='LangEn' Style='{StaticResource LangItem}' Content='English'/>\r\n          <Button x:Name='LangLt' Style='{StaticResource LangItem}' Content='Lietuvių' Margin='0,4,0,0'/>\r\n        </StackPanel>\r\n      </Border>\r\n    </Popup>\r\n    <StackPanel Orientation='Horizontal' HorizontalAlignment='Right' VerticalAlignment='Top' Margin='0,16,12,0'>\r\n      <Button x:Name='Min' Style='{StaticResource Chrome}' Width='34' Height='30' ToolTip='Minimize'><Line X1='0' Y1='0' X2='11' Y2='0' Stroke='#D0D6E2' StrokeThickness='1.2'/></Button>\r\n      <Button x:Name='Close' Style='{StaticResource Chrome}' Width='34' Height='30' ToolTip='Close'><Path Data='M0,0 L10,10 M10,0 L0,10' Stroke='#D0D6E2' StrokeThickness='1.2'/></Button>\r\n    </StackPanel>\r\n\r\n    <StackPanel VerticalAlignment='Top' HorizontalAlignment='Center' Margin='0,60,0,0' Width='470'>\r\n      <Canvas Width='76' Height='76' HorizontalAlignment='Center'>\r\n        <Canvas.Effect><DropShadowEffect Color='White' BlurRadius='14' ShadowDepth='0' Opacity='.16'/></Canvas.Effect>\r\n        <Rectangle Canvas.Left='4.75' Canvas.Top='7' Width='9.5' Height='43' RadiusX='4.75' RadiusY='4.75' Fill='#E8EBF0'/>\r\n        <Rectangle Canvas.Left='19' Canvas.Top='16.5' Width='9.5' Height='43' RadiusX='4.75' RadiusY='4.75' Fill='#E8EBF0'/>\r\n        <Rectangle Canvas.Left='33.25' Canvas.Top='26' Width='9.5' Height='43' RadiusX='4.75' RadiusY='4.75' Fill='#E8EBF0'/>\r\n        <Rectangle Canvas.Left='47.5' Canvas.Top='16.5' Width='9.5' Height='43' RadiusX='4.75' RadiusY='4.75' Fill='#E8EBF0'/>\r\n        <Rectangle Canvas.Left='61.75' Canvas.Top='7' Width='9.5' Height='43' RadiusX='4.75' RadiusY='4.75' Fill='#E8EBF0'/>\r\n      </Canvas>\r\n      <StackPanel Orientation='Horizontal' HorizontalAlignment='Center' Margin='0,94,0,0'>\r\n        <Border x:Name='Dot1' Height='3' CornerRadius='1.5' Background='White' Margin='0,0,6,0'/>\r\n        <Border x:Name='Dot2' Height='3' CornerRadius='1.5' Background='White'/>\r\n      </StackPanel>\r\n      <TextBlock x:Name='Title' Foreground='White' FontSize='31' FontWeight='Bold' HorizontalAlignment='Center' Margin='0,10,0,0'/>\r\n      <TextBlock Text='Ver. {VERSION}' Foreground='#9AA3B4' FontSize='13' FontWeight='Medium' HorizontalAlignment='Center' Margin='0,8,0,0'/>\r\n      <TextBlock x:Name='Desc' FontSize='15.5' FontWeight='Medium' TextWrapping='Wrap' TextAlignment='Center' LineHeight='25' Margin='0,22,0,0'/>\r\n      <StackPanel x:Name='Progress' Margin='0,48,0,0'>\r\n        <Border x:Name='Track' Height='6' CornerRadius='3' Background='#2EFFFFFF'>\r\n          <Border x:Name='Bar' HorizontalAlignment='Left' Width='8' CornerRadius='3' Background='White'/>\r\n        </Border>\r\n        <Grid Margin='0,14,0,0'>\r\n          <TextBlock x:Name='Pct' Foreground='White' FontSize='14' FontWeight='Bold' HorizontalAlignment='Left'/>\r\n          <TextBlock x:Name='Mb' Foreground='White' FontSize='14' FontWeight='Medium' HorizontalAlignment='Right'/>\r\n        </Grid>\r\n      </StackPanel>\r\n      <Button x:Name='Main' Style='{StaticResource Glass}' HorizontalAlignment='Center'/>\r\n    </StackPanel>\r\n  </Grid>\r\n</Window>";

	private static readonly string InstallDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "Vateko.fun");

	private static readonly string[][] Text = new string[7][]
	{
		new string[2] { "English", "Lietuvių" },
		new string[2] { "Full songs, daily mixes and your own music, all in one dark and fast player.", "Pilnos dainos, dienos miksai ir tavo muzika viename tamsiame ir greitame grotuve." },
		new string[2] { "Install Vateko.fun", "Įdiegti Vateko.fun" },
		new string[2] { "Installing Vateko.fun", "Diegiama Vateko.fun" },
		new string[2] { "Vateko.fun is ready", "Vateko.fun paruošta" },
		new string[2] { "Launch Vateko.fun", "Paleisti Vateko.fun" },
		new string[2] { "Install failed (code {0}). Close Vateko.fun and try again.", "Įdiegti nepavyko (kodas {0}). Uždaryk Vateko.fun ir bandyk dar kartą." }
	};

	private static Window win;

	private static int lang;

	private static int step;

	private static int failCode;

	private static double done;

	// update mode: started by an older Vateko.fun (its "Update" button) instead of a double click
	private static bool auto;

	private static bool relaunch;

	[STAThread]
	private static void Main(string[] args)
	{
		// An app started this file and quits a moment later, and Windows closes everything in the app's job with it.
		// First thing, before WPF loads: start a copy outside that job (instantly, or through WMI) and exit.
		bool inJob;
		if (!args.Contains("--escaped") && IsProcessInJob(Process.GetCurrentProcess().Handle, IntPtr.Zero, out inJob) && inJob)
		{
			string cmd = "\"" + Process.GetCurrentProcess().MainModule.FileName + "\" " + string.Join(" ", args) + " --escaped --from-app";
			STARTUPINFO si = new STARTUPINFO();
			si.cb = Marshal.SizeOf(si);
			PROCESS_INFORMATION pi;
			if (CreateProcess(null, cmd, IntPtr.Zero, IntPtr.Zero, false, 0x01000000 /* CREATE_BREAKAWAY_FROM_JOB */, IntPtr.Zero, null, ref si, out pi))
			{
				Log("escaped (breakaway): " + cmd);
				return;
			}
			try
			{
				new ManagementClass("Win32_Process").InvokeMethod("Create", new object[1] { cmd });
				Log("escaped (wmi): " + cmd);
				return;
			}
			catch (Exception ex)
			{
				Log(ex);
			}
		}
		// /S = an app update asked for a silent install (1.0.4+); --from-app = any older app's Update button (1.0.0+)
		auto = args.Contains("/S") || args.Contains("--from-app") || Process.GetProcessesByName("Vateko.fun").Length > 0;
		// 1.0.6+ start the app again themselves after "/S"; everything else expects the setup to do it
		relaunch = !args.Contains("/S") || args.Contains("--force-run") || args.Contains("--from-app");
		lang = ((CultureInfo.CurrentUICulture.TwoLetterISOLanguageName == "lt") ? 1 : 0);
		Application application = new Application();
		AppDomain.CurrentDomain.UnhandledException += delegate(object s, UnhandledExceptionEventArgs e)
		{
			Log(e.ExceptionObject);
		};
		application.DispatcherUnhandledException += delegate(object s, DispatcherUnhandledExceptionEventArgs e)
		{
			Log(e.Exception);
		};
		application.Exit += delegate(object s, ExitEventArgs e)
		{
			Log("exit " + e.ApplicationExitCode + " step " + step);
		};
		win = (Window)XamlReader.Parse("\r\n<Window xmlns='http://schemas.microsoft.com/winfx/2006/xaml/presentation' xmlns:x='http://schemas.microsoft.com/winfx/2006/xaml'\r\n        Title='Vateko.fun Setup' Width='666' Height='666' WindowStyle='None' ResizeMode='CanMinimize' WindowStartupLocation='CenterScreen'\r\n        Background='#04070E' BorderBrush='#2A3346' BorderThickness='1' UseLayoutRounding='True' TextOptions.TextRenderingMode='Grayscale'>\r\n  <Window.Resources>\r\n    <Style x:Key='Chrome' TargetType='Button'>\r\n      <Setter Property='Cursor' Value='Hand'/>\r\n      <Setter Property='Template'><Setter.Value>\r\n        <ControlTemplate TargetType='Button'>\r\n          <Border x:Name='bg' Background='Transparent' CornerRadius='6' Padding='{TemplateBinding Padding}'>\r\n            <ContentPresenter VerticalAlignment='Center' HorizontalAlignment='Center'/>\r\n          </Border>\r\n          <ControlTemplate.Triggers>\r\n            <Trigger Property='IsMouseOver' Value='True'><Setter TargetName='bg' Property='Background' Value='#14FFFFFF'/></Trigger>\r\n          </ControlTemplate.Triggers>\r\n        </ControlTemplate>\r\n      </Setter.Value></Setter>\r\n    </Style>\r\n    <Style x:Key='Glass' TargetType='Button'>\r\n      <Setter Property='Foreground' Value='White'/>\r\n      <Setter Property='FontSize' Value='15'/>\r\n      <Setter Property='FontWeight' Value='Bold'/>\r\n      <Setter Property='Cursor' Value='Hand'/>\r\n      <Setter Property='Template'><Setter.Value>\r\n        <ControlTemplate TargetType='Button'>\r\n          <Border x:Name='bg' CornerRadius='6' BorderThickness='1' BorderBrush='#3DFFFFFF' Background='#1FFFFFFF' Padding='25,13'>\r\n            <ContentPresenter HorizontalAlignment='Center'/>\r\n          </Border>\r\n          <ControlTemplate.Triggers>\r\n            <Trigger Property='IsMouseOver' Value='True'><Setter TargetName='bg' Property='Background' Value='#2EFFFFFF'/><Setter TargetName='bg' Property='BorderBrush' Value='#52FFFFFF'/></Trigger>\r\n            <Trigger Property='IsPressed' Value='True'><Setter TargetName='bg' Property='Background' Value='#1AFFFFFF'/></Trigger>\r\n            <Trigger Property='IsKeyboardFocused' Value='True'><Setter TargetName='bg' Property='BorderBrush' Value='#B3FFFFFF'/></Trigger>\r\n          </ControlTemplate.Triggers>\r\n        </ControlTemplate>\r\n      </Setter.Value></Setter>\r\n    </Style>\r\n    <Style x:Key='LangItem' TargetType='Button'>\r\n      <Setter Property='Foreground' Value='White'/>\r\n      <Setter Property='FontSize' Value='14'/>\r\n      <Setter Property='Cursor' Value='Hand'/>\r\n      <Setter Property='Template'><Setter.Value>\r\n        <ControlTemplate TargetType='Button'>\r\n          <Border x:Name='bg' Background='Transparent' CornerRadius='4' Padding='12,9'>\r\n            <ContentPresenter HorizontalAlignment='Left'/>\r\n          </Border>\r\n          <ControlTemplate.Triggers>\r\n            <Trigger Property='IsMouseOver' Value='True'><Setter TargetName='bg' Property='Background' Value='#1CFFFFFF'/></Trigger>\r\n            <Trigger Property='Tag' Value='on'><Setter TargetName='bg' Property='Background' Value='#2E3238'/></Trigger>\r\n          </ControlTemplate.Triggers>\r\n        </ControlTemplate>\r\n      </Setter.Value></Setter>\r\n    </Style>\r\n    <Style TargetType='CheckBox'>\r\n      <Setter Property='Foreground' Value='White'/>\r\n      <Setter Property='FontSize' Value='14'/>\r\n      <Setter Property='Cursor' Value='Hand'/>\r\n      <Setter Property='Template'><Setter.Value>\r\n        <ControlTemplate TargetType='CheckBox'>\r\n          <StackPanel Orientation='Horizontal' Background='Transparent'>\r\n            <Border x:Name='box' Width='22' Height='22' CornerRadius='4' BorderThickness='1' BorderBrush='#40FFFFFF' Background='#1FFFFFFF'>\r\n              <Path x:Name='tick' Data='M5,11 L9,15 L17,7' Stroke='White' StrokeThickness='2' Visibility='Collapsed' StrokeStartLineCap='Round' StrokeEndLineCap='Round'/>\r\n            </Border>\r\n            <ContentPresenter Margin='10,0,0,0' VerticalAlignment='Center'/>\r\n          </StackPanel>\r\n          <ControlTemplate.Triggers>\r\n            <Trigger Property='IsChecked' Value='True'><Setter TargetName='tick' Property='Visibility' Value='Visible'/></Trigger>\r\n            <Trigger Property='IsMouseOver' Value='True'><Setter TargetName='box' Property='BorderBrush' Value='#80FFFFFF'/></Trigger>\r\n          </ControlTemplate.Triggers>\r\n        </ControlTemplate>\r\n      </Setter.Value></Setter>\r\n    </Style>\r\n  </Window.Resources>\r\n  <Grid ClipToBounds='True'>\r\n    <Canvas IsHitTestVisible='False'>\r\n      <Ellipse x:Name='B1' Width='860' Height='640' Canvas.Left='-170' Canvas.Top='170'>\r\n        <Ellipse.Fill><RadialGradientBrush><GradientStop Color='#F02C66BC' Offset='0'/><GradientStop Color='#8A1F4F9A' Offset='.55'/><GradientStop Color='#001F4F9A' Offset='1'/></RadialGradientBrush></Ellipse.Fill>\r\n      </Ellipse>\r\n      <Ellipse x:Name='B2' Width='480' Height='440' Canvas.Left='400' Canvas.Top='80'>\r\n        <Ellipse.Fill><RadialGradientBrush><GradientStop Color='#C86E9EDC' Offset='0'/><GradientStop Color='#004A7CC4' Offset='1'/></RadialGradientBrush></Ellipse.Fill>\r\n      </Ellipse>\r\n      <Ellipse x:Name='B3' Width='560' Height='460' Canvas.Left='320' Canvas.Top='420'>\r\n        <Ellipse.Fill><RadialGradientBrush><GradientStop Color='#E0173F88' Offset='0'/><GradientStop Color='#00173F88' Offset='1'/></RadialGradientBrush></Ellipse.Fill>\r\n      </Ellipse>\r\n      <Ellipse x:Name='B4' Width='540' Height='440' Canvas.Left='120' Canvas.Top='160'>\r\n        <Ellipse.Fill><RadialGradientBrush><GradientStop Color='#A03E7BCC' Offset='0'/><GradientStop Color='#003E7BCC' Offset='1'/></RadialGradientBrush></Ellipse.Fill>\r\n      </Ellipse>\r\n    </Canvas>\r\n    <!-- dark top-left corner like Hydra -->\r\n    <Rectangle IsHitTestVisible='False'>\r\n      <Rectangle.Fill><LinearGradientBrush StartPoint='0,0' EndPoint='.85,.95'><GradientStop Color='#F805080F' Offset='0'/><GradientStop Color='#9005080F' Offset='.25'/><GradientStop Color='#0005080F' Offset='.55'/><GradientStop Color='#0005080F' Offset='.85'/><GradientStop Color='#3005080F' Offset='1'/></LinearGradientBrush></Rectangle.Fill>\r\n    </Rectangle>\r\n\r\n    <Button x:Name='Lang' Style='{StaticResource Chrome}' HorizontalAlignment='Left' VerticalAlignment='Top' Margin='14,14,0,0' Padding='10,6'>\r\n      <StackPanel Orientation='Horizontal'>\r\n        <Canvas Width='16' Height='16' VerticalAlignment='Center'>\r\n          <Ellipse Width='16' Height='16' Stroke='White' StrokeThickness='1.3'/>\r\n          <Ellipse Width='7' Height='16' Canvas.Left='4.5' Stroke='White' StrokeThickness='1.3'/>\r\n          <Line X1='0.5' Y1='8' X2='15.5' Y2='8' Stroke='White' StrokeThickness='1.3'/>\r\n        </Canvas>\r\n        <TextBlock x:Name='LangText' Margin='9,0,10,0' FontSize='14' FontWeight='Bold' Foreground='White' VerticalAlignment='Center'/>\r\n        <Path Data='M0,0 L4.5,4.5 L9,0' Stroke='White' StrokeThickness='1.3' VerticalAlignment='Center' RenderTransformOrigin='.5,.5'>\r\n          <Path.RenderTransform><ScaleTransform x:Name='Chev'/></Path.RenderTransform>\r\n        </Path>\r\n      </StackPanel>\r\n    </Button>\r\n    <Popup x:Name='LangPop' PlacementTarget='{Binding ElementName=Lang}' Placement='Bottom' HorizontalOffset='-4' VerticalOffset='6' StaysOpen='False' AllowsTransparency='True'>\r\n      <Border Background='#0B0E13' BorderBrush='#2A3039' BorderThickness='1' CornerRadius='8' Padding='7' Width='196'>\r\n        <StackPanel>\r\n          <Button x:Name='LangEn' Style='{StaticResource LangItem}' Content='English'/>\r\n          <Button x:Name='LangLt' Style='{StaticResource LangItem}' Content='Lietuvių' Margin='0,4,0,0'/>\r\n        </StackPanel>\r\n      </Border>\r\n    </Popup>\r\n    <StackPanel Orientation='Horizontal' HorizontalAlignment='Right' VerticalAlignment='Top' Margin='0,16,12,0'>\r\n      <Button x:Name='Min' Style='{StaticResource Chrome}' Width='34' Height='30' ToolTip='Minimize'><Line X1='0' Y1='0' X2='11' Y2='0' Stroke='#D0D6E2' StrokeThickness='1.2'/></Button>\r\n      <Button x:Name='Close' Style='{StaticResource Chrome}' Width='34' Height='30' ToolTip='Close'><Path Data='M0,0 L10,10 M10,0 L0,10' Stroke='#D0D6E2' StrokeThickness='1.2'/></Button>\r\n    </StackPanel>\r\n\r\n    <StackPanel VerticalAlignment='Top' HorizontalAlignment='Center' Margin='0,60,0,0' Width='470'>\r\n      <Canvas Width='76' Height='76' HorizontalAlignment='Center'>\r\n        <Canvas.Effect><DropShadowEffect Color='White' BlurRadius='14' ShadowDepth='0' Opacity='.16'/></Canvas.Effect>\r\n        <Rectangle Canvas.Left='4.75' Canvas.Top='7' Width='9.5' Height='43' RadiusX='4.75' RadiusY='4.75' Fill='#E8EBF0'/>\r\n        <Rectangle Canvas.Left='19' Canvas.Top='16.5' Width='9.5' Height='43' RadiusX='4.75' RadiusY='4.75' Fill='#E8EBF0'/>\r\n        <Rectangle Canvas.Left='33.25' Canvas.Top='26' Width='9.5' Height='43' RadiusX='4.75' RadiusY='4.75' Fill='#E8EBF0'/>\r\n        <Rectangle Canvas.Left='47.5' Canvas.Top='16.5' Width='9.5' Height='43' RadiusX='4.75' RadiusY='4.75' Fill='#E8EBF0'/>\r\n        <Rectangle Canvas.Left='61.75' Canvas.Top='7' Width='9.5' Height='43' RadiusX='4.75' RadiusY='4.75' Fill='#E8EBF0'/>\r\n      </Canvas>\r\n      <StackPanel Orientation='Horizontal' HorizontalAlignment='Center' Margin='0,94,0,0'>\r\n        <Border x:Name='Dot1' Height='3' CornerRadius='1.5' Background='White' Margin='0,0,6,0'/>\r\n        <Border x:Name='Dot2' Height='3' CornerRadius='1.5' Background='White'/>\r\n      </StackPanel>\r\n      <TextBlock x:Name='Title' Foreground='White' FontSize='31' FontWeight='Bold' HorizontalAlignment='Center' Margin='0,10,0,0'/>\r\n      <TextBlock Text='Ver. {VERSION}' Foreground='#9AA3B4' FontSize='13' FontWeight='Medium' HorizontalAlignment='Center' Margin='0,8,0,0'/>\r\n      <TextBlock x:Name='Desc' FontSize='15.5' FontWeight='Medium' TextWrapping='Wrap' TextAlignment='Center' LineHeight='25' Margin='0,22,0,0'/>\r\n      <StackPanel x:Name='Progress' Margin='0,48,0,0'>\r\n        <Border x:Name='Track' Height='6' CornerRadius='3' Background='#2EFFFFFF'>\r\n          <Border x:Name='Bar' HorizontalAlignment='Left' Width='8' CornerRadius='3' Background='White'/>\r\n        </Border>\r\n        <Grid Margin='0,14,0,0'>\r\n          <TextBlock x:Name='Pct' Foreground='White' FontSize='14' FontWeight='Bold' HorizontalAlignment='Left'/>\r\n          <TextBlock x:Name='Mb' Foreground='White' FontSize='14' FontWeight='Medium' HorizontalAlignment='Right'/>\r\n        </Grid>\r\n      </StackPanel>\r\n      <Button x:Name='Main' Style='{StaticResource Glass}' HorizontalAlignment='Center'/>\r\n    </StackPanel>\r\n  </Grid>\r\n</Window>".Replace("{VERSION}", Build.Version));
		win.FontFamily = LoadFont();
		win.MouseLeftButtonDown += delegate(object s, MouseButtonEventArgs e)
		{
			if (e.ButtonState == MouseButtonState.Pressed)
			{
				win.DragMove();
			}
		};
		Get<Button>("Close").Click += delegate
		{
			if (step != 1)
			{
				win.Close();
			}
		};
		Get<Button>("Min").Click += delegate
		{
			win.WindowState = WindowState.Minimized;
		};
		Popup pop = Get<Popup>("LangPop");
		Get<Button>("Lang").Click += delegate
		{
			pop.IsOpen = !pop.IsOpen;
		};
		pop.Opened += delegate
		{
			Get<ScaleTransform>("Chev").ScaleY = -1.0;
		};
		pop.Closed += delegate
		{
			Get<ScaleTransform>("Chev").ScaleY = 1.0;
		};
		Get<Button>("LangEn").Click += delegate
		{
			lang = 0;
			pop.IsOpen = false;
			Render();
		};
		Get<Button>("LangLt").Click += delegate
		{
			lang = 1;
			pop.IsOpen = false;
			Render();
		};
		Get<Button>("Main").Click += delegate
		{
			if (step == 0 || step == 3)
			{
				Install();
			}
			else if (step == 2)
			{
				Launch();
			}
		};
		Animate();
		Render();
		if (auto)
		{
			win.Loaded += delegate
			{
				// let the old app finish closing (it quits ~0.4-1.5 s after starting this), then install right away
				new Thread((ThreadStart)delegate
				{
					foreach (Process p in Process.GetProcessesByName("Vateko.fun"))
					{
						try { p.WaitForExit(8000); } catch { }
					}
					win.Dispatcher.BeginInvoke((Action)Install);
				}) { IsBackground = true }.Start();
			};
		}
		application.Run(win);
	}

	[DllImport("kernel32.dll")]
	private static extern bool IsProcessInJob(IntPtr process, IntPtr job, out bool result);

	[DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
	private static extern bool CreateProcess(string app, string cmd, IntPtr pa, IntPtr ta, bool inherit, uint flags, IntPtr env, string dir, ref STARTUPINFO si, out PROCESS_INFORMATION pi);

	[StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
	private struct STARTUPINFO
	{
		public int cb; public string lpReserved, lpDesktop, lpTitle;
		public int dwX, dwY, dwXSize, dwYSize, dwXCountChars, dwYCountChars, dwFillAttribute, dwFlags;
		public short wShowWindow, cbReserved2;
		public IntPtr lpReserved2, hStdInput, hStdOutput, hStdError;
	}

	[StructLayout(LayoutKind.Sequential)]
	private struct PROCESS_INFORMATION
	{
		public IntPtr hProcess, hThread;
		public int dwProcessId, dwThreadId;
	}

	private static void Log(object msg)
	{
		try
		{
			File.AppendAllText(Path.Combine(Path.GetTempPath(), "vateko-setup.log"), string.Concat(DateTime.Now, " ", msg, "\r\n"));
		}
		catch
		{
		}
	}

	private static TEl Get<TEl>(string name) where TEl : class
	{
		return (TEl)win.FindName(name);
	}

	private static string S(T key)
	{
		return Text[(int)key][lang];
	}

	private static FontFamily LoadFont()
	{
		try
		{
			string text = Path.Combine(Path.GetTempPath(), "vateko-setup-fonts");
			Directory.CreateDirectory(text);
			string[] array = new string[2] { "SpaceGrotesk-Medium.ttf", "SpaceGrotesk-Bold.ttf" };
			foreach (string text2 in array)
			{
				string path = Path.Combine(text, text2);
				if (File.Exists(path))
				{
					continue;
				}
				using (Stream stream = typeof(Setup).Assembly.GetManifestResourceStream(text2))
				using (FileStream destination = File.Create(path))
				{
					stream.CopyTo(destination);
				}
			}
			return new FontFamily(new Uri(text + "\\"), "./#Space Grotesk");
		}
		catch (Exception msg)
		{
			Log(msg);
			return new FontFamily("Segoe UI");
		}
	}

	private static void Render()
	{
		Get<TextBlock>("LangText").Text = S(T.Lang);
		string[] array = new string[2] { "LangEn", "LangLt" };
		foreach (string text in array)
		{
			bool flag = text == "LangLt" == (lang == 1);
			Button button = Get<Button>(text);
			button.Tag = (flag ? "on" : null);
			button.FontWeight = (flag ? FontWeights.Bold : FontWeights.Medium);
		}
		Get<TextBlock>("Title").Text = ((step == 1) ? S(T.Installing) : ((step == 2) ? S(T.Done) : "Vateko.fun"));
		TextBlock textBlock = Get<TextBlock>("Desc");
		textBlock.Text = ((step == 3) ? string.Format(S(T.Failed), failCode) : S(T.Desc));
		textBlock.Foreground = new SolidColorBrush((step == 3) ? Color.FromRgb(byte.MaxValue, 150, 160) : Color.FromRgb(201, 209, 222));
		Get<FrameworkElement>("Progress").Visibility = ((step != 1 && step != 2) ? Visibility.Collapsed : Visibility.Visible);
		Button button2 = Get<Button>("Main");
		button2.Content = ((step == 2) ? S(T.Launch) : S(T.Install));
		button2.Visibility = ((step == 1) ? Visibility.Collapsed : Visibility.Visible);
		button2.Margin = new Thickness(0.0, (step == 2) ? 28 : 40, 0.0, 0.0);
		Get<FrameworkElement>("Dot1").Width = ((step == 0) ? 16 : 4);
		Get<FrameworkElement>("Dot2").Width = ((step == 0) ? 4 : 16);
		Get<FrameworkElement>("Dot1").Opacity = ((step == 0) ? 1.0 : 0.45);
		Get<FrameworkElement>("Dot2").Opacity = ((step == 0) ? 0.45 : 1.0);
		ShowProgress();
	}

	private static void ShowProgress()
	{
		FrameworkElement frameworkElement = Get<FrameworkElement>("Track");
		Get<FrameworkElement>("Bar").Width = Math.Max(8.0, ((frameworkElement.ActualWidth > 0.0) ? frameworkElement.ActualWidth : 470.0) * done);
		Get<TextBlock>("Pct").Text = (int)Math.Round(done * 100.0) + "%";
		Get<TextBlock>("Mb").Text = (int)(done * Build.UnpackedBytes / 1048576.0) + " MB / " + Build.UnpackedBytes / 1048576 + " MB";
	}

	private static void Animate()
	{
		Random random = new Random(7);
		string[] array = new string[4] { "B1", "B2", "B3", "B4" };
		foreach (string name in array)
		{
			TranslateTransform translateTransform = new TranslateTransform();
			Get<FrameworkElement>(name).RenderTransform = translateTransform;
			DependencyProperty[] array2 = new DependencyProperty[2]
			{
				TranslateTransform.XProperty,
				TranslateTransform.YProperty
			};
			foreach (DependencyProperty dp in array2)
			{
				DoubleAnimation doubleAnimation = new DoubleAnimation(-120 - random.Next(70), 120 + random.Next(70), TimeSpan.FromSeconds(5 + random.Next(5)));
				doubleAnimation.AutoReverse = true;
				doubleAnimation.RepeatBehavior = RepeatBehavior.Forever;
				doubleAnimation.EasingFunction = new SineEase
				{
					EasingMode = EasingMode.EaseInOut
				};
				translateTransform.BeginAnimation(dp, doubleAnimation);
			}
		}
	}

	private static void Install()
	{
		step = 1;
		done = 0.0;
		Render();
		Thread thread = new Thread((ThreadStart)delegate
		{
			int code;
			try
			{
				Process[] processesByName = Process.GetProcessesByName("Vateko.fun");
				foreach (Process process in processesByName)
				{
					try
					{
						process.Kill();
						process.WaitForExit(5000);
					}
					catch
					{
					}
				}
				try
				{
					if (Directory.Exists(InstallDir))
					{
						Directory.Delete(InstallDir, recursive: true);
					}
				}
				catch (Exception msg)
				{
					Log(msg);
				}
				string text = Path.Combine(Path.GetTempPath(), "Vateko.fun-Core.exe");
				using (Stream stream = typeof(Setup).Assembly.GetManifestResourceStream("core.exe"))
				using (FileStream destination = File.Create(text))
				{
					stream.CopyTo(destination);
				}
				Process process2 = Process.Start(new ProcessStartInfo(text, "/S")
				{
					UseShellExecute = false
				});
				while (!process2.WaitForExit(250))
				{
					double f = Math.Min(0.99, (double)DirSize(InstallDir) / Build.UnpackedBytes);
					win.Dispatcher.BeginInvoke((Action)delegate
					{
						done = Math.Max(done, f);
						ShowProgress();
					});
				}
				code = process2.ExitCode;
				Log("core exit " + code);
				try
				{
					File.Delete(text);
				}
				catch
				{
				}
			}
			catch (Exception msg2)
			{
				Log(msg2);
				code = -1;
			}
			win.Dispatcher.BeginInvoke((Action)delegate
			{
				failCode = code;
				step = ((code == 0 && File.Exists(Path.Combine(InstallDir, "Vateko.fun.exe"))) ? 2 : 3);
				if (step == 2)
				{
					done = 1.0;
				}
				Render();
				win.Activate();
				if (auto && step == 2)
				{
					// update finished: reopen the app (unless the app's own helper does it) and close this window
					DispatcherTimer t = new DispatcherTimer { Interval = TimeSpan.FromSeconds(1.2) };
					t.Tick += delegate
					{
						t.Stop();
						if (relaunch) Launch(); else win.Close();
					};
					t.Start();
				}
			});
		});
		thread.IsBackground = true;
		thread.Start();
	}

	private static long DirSize(string dir)
	{
		try
		{
			return Directory.Exists(dir) ? new DirectoryInfo(dir).EnumerateFiles("*", SearchOption.AllDirectories).Sum(delegate(FileInfo f)
			{
				try
				{
					return f.Length;
				}
				catch
				{
					return 0L;
				}
			}) : 0;
		}
		catch
		{
			return 0L;
		}
	}

	private static void Launch()
	{
		ProcessStartInfo processStartInfo = new ProcessStartInfo(Path.Combine(InstallDir, "Vateko.fun.exe"));
		processStartInfo.WorkingDirectory = InstallDir;
		Process.Start(processStartInfo);
		win.Close();
	}
}
