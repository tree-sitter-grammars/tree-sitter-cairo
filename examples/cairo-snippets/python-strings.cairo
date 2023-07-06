const a = 1;

%{
    print('hi %{ foobar %}')
    print(bye)
%}

%{
    print("hi %{ foobar %}")
    print(bye)
%}

%{
    print('''hi %{ foobar %}''')
    print(bye)
%}

%{
    print("""hi %{ foobar %}""")
    print(bye)
%}

%{
    print(f"hi %{ foobar %}")
    print(bye)
%}

const b = 2;
